from context import SYSTEM_PROMPT


def build_system_prompt(summary: str = "") -> str:
    """
    Build the final system prompt sent to the LLM.

    The system prompt consists of:
    1. Static identity (SYSTEM_PROMPT)
    2. Long-term conversation summary (optional)

    The actual conversation history is sent separately through
    the Bedrock `messages` parameter.
    """

    if not summary.strip():
        return SYSTEM_PROMPT

    return f"""{SYSTEM_PROMPT}

========================================================================
LONG-TERM CONVERSATION MEMORY
========================================================================

The following is a summary of previous conversations with this visitor.

Use it only when it is relevant to maintain continuity.

{summary}
"""