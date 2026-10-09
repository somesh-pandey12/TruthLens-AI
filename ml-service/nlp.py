import re
from textblob import TextBlob

URL_RE = re.compile(r"http\S+")


def clean_text(text: str, limit: int) -> str:
    return URL_RE.sub("", text or "").strip()[:limit]


def sentiment_features(text: str) -> dict:
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    label = "POSITIVE" if polarity > 0.05 else "NEGATIVE" if polarity < -0.05 else "NEUTRAL"
    return {
        "sentiment": label,
        "polarity": round(polarity, 3),
        "subjectivity": round(blob.sentiment.subjectivity * 100, 2),
    }