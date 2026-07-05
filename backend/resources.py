import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

def load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_text(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")

    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


# Single source of truth for Hassan's profile
facts = load_json("facts.json")
# Communication style
style = load_text("style.txt")