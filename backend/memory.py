import json
import os
from typing import List, Dict
import boto3
from botocore.exceptions import ClientError


USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET", "")
MEMORY_DIR = os.getenv("MEMORY_DIR", "../memory")

if USE_S3:
    s3_client = boto3.client("s3")


def _conversation_key(session_id: str) -> str:
    return f"sessions/{session_id}.json"


def _summary_key(session_id: str) -> str:
    return f"summaries/{session_id}.txt"


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history."""

    if USE_S3:
        try:
            response = s3_client.get_object(
                Bucket=S3_BUCKET,
                Key=_conversation_key(session_id),
            )
            return json.loads(response["Body"].read().decode("utf-8"))

        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return []
            raise

    os.makedirs(os.path.join(MEMORY_DIR, "sessions"), exist_ok=True)

    path = os.path.join(
        MEMORY_DIR,
        _conversation_key(session_id),
    )

    if not os.path.exists(path):
        return []

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_conversation(session_id: str, conversation: List[Dict]) -> None:
    """Save conversation history."""

    if USE_S3:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=_conversation_key(session_id),
            Body=json.dumps(conversation, indent=2),
            ContentType="application/json",
        )
        return

    os.makedirs(os.path.join(MEMORY_DIR, "sessions"), exist_ok=True)

    path = os.path.join(
        MEMORY_DIR,
        _conversation_key(session_id),
    )

    with open(path, "w", encoding="utf-8") as f:
        json.dump(conversation, f, indent=2)



def load_summary(session_id: str) -> str:
    """Load conversation summary."""

    if USE_S3:
        try:
            response = s3_client.get_object(
                Bucket=S3_BUCKET,
                Key=_summary_key(session_id),
            )
            return response["Body"].read().decode("utf-8")

        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return ""
            raise

    os.makedirs(os.path.join(MEMORY_DIR, "summaries"), exist_ok=True)

    path = os.path.join(
        MEMORY_DIR,
        _summary_key(session_id),
    )

    if not os.path.exists(path):
        return ""

    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def save_summary(session_id: str, summary: str) -> None:
    """Save conversation summary."""

    if USE_S3:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=_summary_key(session_id),
            Body=summary,
            ContentType="text/plain",
        )
        return

    os.makedirs(os.path.join(MEMORY_DIR, "summaries"), exist_ok=True)

    path = os.path.join(
        MEMORY_DIR,
        _summary_key(session_id),
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(summary)



def trim_conversation(
    conversation: List[Dict],
    max_messages: int = 12,
) -> List[Dict]:
    """
    Keep only the most recent messages.
    """

    if len(conversation) <= max_messages:
        return conversation

    return conversation[-max_messages:]


def should_summarize(
    conversation: List[Dict],
    threshold: int = 20,
) -> bool:
    """
    Determine whether the conversation should be summarized.
    """

    return len(conversation) >= threshold