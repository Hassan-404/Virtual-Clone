import re
from typing import Optional

from resources import facts

personal = facts.get("personal_information", {})


INTENTS = [
    {
        "patterns": [
            r"\b(email|e-?mail|mail address|email address)\b",
        ],
        "response": lambda: personal.get("email"),
    },
    {
        "patterns": [
            r"\b(phone|phone number|mobile|contact number|cell number|telephone)\b",
        ],
        "response": lambda: personal.get("phone"),
    },
    {
        "patterns": [
            r"\b(linkedin|linked\s?in|linkedin profile|linkedin url)\b",
        ],
        "response": lambda: personal.get("linkedin"),
    },
    {
        "patterns": [
            r"where (are|r) you (based|located)",
            r"where do you live",
            r"\byour location\b",
            r"\bcurrent location\b",
        ],
        "response": lambda: personal.get("location"),
    },
    {
        "patterns": [
            r"what('?s| is) your name",
            r"who are you",
            r"\byour name\b",
        ],
        "response": lambda: personal.get("full_name"),
    },
    {
        "patterns": [
            r"preferred name",
            r"nickname",
        ],
        "response": lambda: personal.get(
            "preferred_name",
            personal.get("full_name"),
        ),
    },
    {
        "patterns": [
            r"current role",
            r"current position",
            r"job title",
            r"what do you do",
            r"what is your role",
        ],
        "response": lambda: personal.get("current_role"),
    },
    {
        "patterns": [
            r"how much experience",
            r"years? of experience",
            r"experience do you have",
        ],
        "response": lambda: (
            f"I have over {personal.get('years_experience')} years of "
            "professional experience in AI/ML engineering."
        ),
    },
    {
        "patterns": [
            r"how can i contact you",
            r"contact you",
            r"best way to contact",
            r"reach you",
        ],
        "response": lambda: (
            f"You can reach me at {personal.get('email')} "
            f"or call me on {personal.get('phone')}. "
            f"My LinkedIn profile is {personal.get('linkedin')}."
        ),
    },
]


def resolve_intent(message: str) -> Optional[str]:
    """
    Return deterministic responses for profile facts.

    Returns:
        str  -> matched response
        None -> let the LLM answer
    """

    message = message.lower().strip()

    for intent in INTENTS:
        for pattern in intent["patterns"]:
            if re.search(pattern, message):
                return intent["response"]()

    return None