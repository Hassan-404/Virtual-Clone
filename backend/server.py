from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

from prompt_builder import build_system_prompt
from memory import (
    load_conversation,
    save_conversation,
    load_summary,
    save_summary,
    trim_conversation,
    should_summarize,
)
from summarizer import summarize_conversation
from intent import resolve_intent
# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS — allow common local dev ports (Next.js may use 3001+ if 3000 is taken)
_dev_origins = [
    f"http://{host}:{port}"
    for host in ("localhost", "127.0.0.1")
    for port in range(3000, 3010)
]
_configured = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in _configured.split(",") if o.strip()] if _configured else _dev_origins.copy()
if not os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    origins = list(dict.fromkeys([*origins, *_dev_origins]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

bedrock_client = boto3.client(
    service_name="bedrock-runtime", 
    region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1")
)

# Bedrock model selection - see Q42 on https://edwarddonner.com/faq for more
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0")

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

def call_bedrock(
    conversation: List[Dict],
    summary: str,
    user_message: str,
) -> str:
    """Call AWS Bedrock with conversation history"""

    conversation = trim_conversation(conversation)
    messages = []

    for msg in conversation:
        messages.append({
            "role": msg["role"],
            "content": [{"text": msg["content"]}]
        })

    messages.append({
        "role": "user",
        "content": [{"text": user_message}]
    })

    try:
        response = bedrock_client.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": build_system_prompt(summary)}],
            messages=messages,
            inferenceConfig={
                "maxTokens": 500,
                "temperature": 0.5,
                "topP": 0.9
            }
        )
        
        # Extract the response text
        return response["output"]["message"]["content"][0]["text"]
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ValidationException':
            print(f"Bedrock validation error: {e}")
            raise HTTPException(
                status_code=400,
                detail=e.response["Error"].get("Message", "Invalid request for Bedrock"),
            )
        elif error_code == 'AccessDeniedException':
            print(f"Bedrock access denied: {e}")
            raise HTTPException(status_code=403, detail="Access denied to Bedrock model")
        else:
            print(f"Bedrock error: {e}")
            raise HTTPException(status_code=500, detail=f"Bedrock error: {str(e)}")


@app.get("/")
async def root():
    return {
        "message": "AI Virtual Clone API (Powered by AWS Bedrock)",
        "memory_enabled": True,
        "conversation_summary": True,
        "ai_model": BEDROCK_MODEL_ID,
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "bedrock_model": BEDROCK_MODEL_ID,
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Load conversation history
        conversation = load_conversation(session_id)
        summary = load_summary(session_id)
        
        intent = resolve_intent(request.message)

        if intent:
            assistant_response = intent
        else:
            assistant_response = call_bedrock(
                conversation,
                summary,
                request.message,
            )
        # Update conversation history
        conversation.append(
            {"role": "user", "content": request.message, "timestamp": datetime.now().isoformat()}
        )
        conversation.append(
            {
                "role": "assistant",
                "content": assistant_response,
                "timestamp": datetime.now().isoformat(),
            }
        )

        if should_summarize(conversation):
            old_messages = conversation[:-12]
            if old_messages:
                summary = summarize_conversation(
                    summary,
                    old_messages,
                )
                save_summary(session_id, summary)
            conversation = trim_conversation(conversation)
        save_conversation(session_id, conversation)
        return ChatResponse(response=assistant_response, session_id=session_id)

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Retrieve conversation history"""
    try:
        conversation = load_conversation(session_id)
        return {"session_id": session_id, "messages": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)