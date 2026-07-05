import os
import boto3
from typing import List, Dict

# ============================================================================
# Bedrock Configuration
# ============================================================================

bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1"),
)

BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "global.amazon.nova-2-lite-v1:0",
)

# ============================================================================
# Prompt Builder
# ============================================================================


def build_summary_prompt(
    existing_summary: str,
    conversation: List[Dict],
) -> str:
    """
    Build a prompt for updating long-term conversation memory.
    """

    history = "\n".join(
        f'{msg["role"].upper()}: {msg["content"]}'
        for msg in conversation
    )

    return f"""
You are a conversation memory engine.

Your job is to maintain long-term conversation memory for Hassan Murtaza's virtual clone.

Merge the existing summary with the new conversation.

Rules:

- Summarize ONLY what happened in this conversation.
- Never invent information.
- Never infer user goals unless explicitly stated.
- Never summarize Hassan's profile, biography, work history, education, skills, certifications, or contact details.
- Remove outdated information.
- Avoid duplicate information.
- Keep the summary concise.

Keep ONLY information useful for continuing future conversations, including:

- user preferences
- corrections made during the conversation
- decisions that were made
- unresolved questions
- ongoing projects
- promised follow-ups
- important discussion topics

Ignore:

- greetings
- farewells
- jokes
- compliments
- casual chit-chat
- one-off factual questions
- profile information already available elsewhere

Maximum length: 120 words.

=========================
Existing Summary
=========================

{existing_summary}

=========================
New Conversation
=========================

{history}

Return ONLY the updated summary.
"""


# ============================================================================
# Bedrock Summarization
# ============================================================================


def summarize_conversation(
    existing_summary: str,
    conversation: List[Dict],
) -> str:
    """
    Generate an updated long-term conversation summary.
    """

    prompt = build_summary_prompt(
        existing_summary,
        conversation,
    )

    response = bedrock_client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[
            {
                "text": (
                    "You are a conversation memory engine. "
                    "Generate factual summaries only. "
                    "Never invent information. "
                    "Never infer facts that were not explicitly discussed."
                )
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ],
            }
        ],
        inferenceConfig={
            "temperature": 0.0,
            "topP": 0.9,
            "maxTokens": 180,
        },
    )

    return response["output"]["message"]["content"][0]["text"].strip()