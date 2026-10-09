import os
from dotenv import load_dotenv

load_dotenv()


def _bool(name, default="false"):
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes")


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODELS = [
    m.strip()
    for m in os.getenv("GROQ_MODELS", "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",")
    if m.strip()
]
MOCK_LLM = _bool("MOCK_LLM")
#public URL safety 
ML_API_KEY = os.getenv("ML_API_KEY", "").strip()
PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
CACHE_MAX_ITEMS = int(os.getenv("CACHE_MAX_ITEMS", "300"))
MAX_TEXT_CHARS = 2000