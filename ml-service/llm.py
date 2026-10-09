import json
import re
import logging

from groq import Groq

import config

log = logging.getLogger("llm")

_client = None


def _get_client():
    global _client
    if _client is None:
        # max_retries=0
        _client = Groq(api_key=config.GROQ_API_KEY, max_retries=0, timeout=30.0)
    return _client


class RateLimited(Exception):
    def __init__(self, retry_after=20):
        super().__init__("LLM rate limited")
        self.retry_after = retry_after


class LLMError(Exception):
    pass


SYSTEM_PROMPT = (
    "You are a careful fact-checking assistant. You judge how credible a piece of news "
    "content is from its wording, plausibility and sourcing signals. You cannot browse the web, "
    "so if you cannot tell, answer UNCERTAIN. Reply with valid JSON only."
)

USER_PROMPT = """Assess the credibility of this content.

Content: {text}
Source URL: {url}
Sentiment: {sentiment} | Subjectivity: {subjectivity}%

Return JSON with exactly these keys:
{{"verdict": "REAL" | "FAKE" | "UNCERTAIN",
  "reliabilityScore": <integer 0-100, higher = more credible>,
  "confidence": <integer 0-100>,
  "explanation": "<one or two sentences>",
  "redFlags": ["<short flag>", "..."]}}"""


def _extract_json(raw: str) -> dict:
    raw = (raw or "").strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def _is_rate_limit(err) -> bool:
    return getattr(err, "status_code", None) == 429 or "rate limit" in str(err).lower()


def _retry_after(err, default=20) -> int:
    try:
        header = err.response.headers.get("retry-after")
        return max(1, int(float(header))) if header else default
    except Exception:
        return default


def _clamp(value, default=50):
    try:
        return int(max(0, min(100, round(float(value)))))
    except (TypeError, ValueError):
        return default


def _normalise(result: dict) -> dict:
    verdict = str(result.get("verdict", "UNCERTAIN")).upper()
    if verdict not in ("REAL", "FAKE", "UNCERTAIN"):
        verdict = "UNCERTAIN"
    flags = result.get("redFlags")
    return {
        "verdict": verdict,
        "reliabilityScore": _clamp(result.get("reliabilityScore")),
        "confidence": _clamp(result.get("confidence")),
        "explanation": str(result.get("explanation", ""))[:500],
        "redFlags": [str(f)[:120] for f in flags][:6] if isinstance(flags, list) else [],
    }


SENSATIONAL = ("breaking", "shocking", "miracle", "secret", "aliens", "100%", "exposed",
               "they don't want you", "share before", "cure", "hoax", "banned")


def _mock(text: str) -> dict:
    hits = [w for w in SENSATIONAL if w in text.lower()]
    if len(hits) >= 2:
        return {"verdict": "FAKE", "reliabilityScore": 15, "confidence": 70,
                "explanation": "Mock mode: sensational language detected.",
                "redFlags": [f"Sensational term: {h}" for h in hits]}
    if hits:
        return {"verdict": "UNCERTAIN", "reliabilityScore": 45, "confidence": 55,
                "explanation": "Mock mode: some sensational wording.", "redFlags": [f"Sensational term: {hits[0]}"]}
    return {"verdict": "REAL", "reliabilityScore": 78, "confidence": 60,
            "explanation": "Mock mode: no obvious red flags.", "redFlags": []}


def assess(text: str, url: str, features: dict):
    """Returns (normalised_result, model_name). Raises RateLimited / LLMError."""
    if config.MOCK_LLM:
        return _normalise(_mock(text)), "mock"
    if not config.GROQ_API_KEY:
        raise LLMError("GROQ_API_KEY is not configured")

    prompt = USER_PROMPT.format(
        text=text, url=url or "Not provided",
        sentiment=features["sentiment"], subjectivity=features["subjectivity"],
    )
    rate_err, other_err = None, None
    for model in config.GROQ_MODELS:
        try:
            log.info("Calling Groq model %s", model)
            resp = _get_client().chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": SYSTEM_PROMPT},
                          {"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            return _normalise(_extract_json(resp.choices[0].message.content)), model
        except Exception as e:  # noqa: BLE001
            if _is_rate_limit(e):
                log.warning("%s rate limited, trying next model", model)
                rate_err = e
            else:
                log.error("%s failed: %s", model, e)
                other_err = e
    if rate_err is not None and other_err is None:
        raise RateLimited(_retry_after(rate_err))
    raise LLMError(str(other_err or "No model available"))