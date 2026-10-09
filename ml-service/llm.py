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
        _client = Groq(api_key=config.GROQ_API_KEY, max_retries=0, timeout=45.0)
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

FACT_SYSTEM = (
    "You are a fact-checking researcher. A reader submitted a claim that was flagged as false or unverified. "
    "Explain what is actually known about the topic. Be conservative: never invent facts, names, numbers, "
    "dates or sources. If the facts cannot be established, say so plainly. Reply with valid JSON only."
)

FACT_PROMPT = """Claim submitted by the reader:
{text}

Earlier credibility assessment: {verdict} - {explanation}

Return JSON with exactly these keys:
{{"summary": "<2-4 sentences: what is actually true about this topic, or that it cannot be established>",
  "facts": ["<specific, verifiable point>", "..."],
  "sources": [{{"title": "<publisher or page title>", "url": "<https URL you actually used>"}}]}}
Use at most 4 facts. Leave "sources" empty unless you actually searched and used those pages."""
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


def _get(obj, key):
    """SDK objects aur plain dicts dono se field padhta hai."""
    if obj is None:
        return None
    return obj.get(key) if isinstance(obj, dict) else getattr(obj, key, None)


def _is_reasoning_model(model: str) -> bool:
    return "gpt-oss" in model


def _is_search_model(model: str) -> bool:
    return model.startswith("groq/compound")


def _chat(model, system, prompt, temperature=0.2, max_tokens=None):
    kwargs = dict(
        model=model,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens or config.MAX_COMPLETION_TOKENS,
    )
    if _is_reasoning_model(model):
        kwargs["extra_body"] = {"reasoning_effort": config.REASONING_EFFORT}
    client = _get_client()
    if _is_search_model(model):
        return client.chat.completions.create(**kwargs)
    try:
        return client.chat.completions.create(**kwargs, response_format={"type": "json_object"})
    except Exception as e:  # noqa: BLE001
        if getattr(e, "status_code", None) == 400:
            log.warning("%s rejected JSON mode, retrying without it: %s", model, e)
            return client.chat.completions.create(**kwargs)
        raise

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
            log.info("Assessing with %s", model)
            resp = _chat(model, SYSTEM_PROMPT, prompt)
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
def _clean_sources(items, limit=5):
    out, seen = [], set()
    for item in items or []:
        url = str(_get(item, "url") or "").strip()
        if not re.match(r"^https?://", url, re.I) or url in seen:
            continue
        seen.add(url)
        title = str(_get(item, "title") or url).strip()[:140]
        out.append({"title": title, "url": url[:500]})
        if len(out) >= limit:
            break
    return out


def _search_sources(resp):
    """groq/compound response se woh pages nikalta hai jinhe model ne search karke padha."""
    found = []
    try:
        for tool in _get(resp.choices[0].message, "executed_tools") or []:
            results = _get(_get(tool, "search_results"), "results")
            for r in results or []:
                found.append({"title": _get(r, "title"), "url": _get(r, "url")})
    except Exception:  # noqa: BLE001
        pass
    return found


def _mock_truth():
    return {"summary": "Mock mode: no live fact-check was performed.", "facts": [], "sources": [],
            "grounded": False, "model": "mock"}


def fact_check(text: str, assessment: dict):
    """What the facts actually say. Fail ho to None deta hai (analysis kabhi fail nahi hoti)."""
    if config.MOCK_LLM:
        return _mock_truth()
    if not config.GROQ_API_KEY:
        return None

    prompt = FACT_PROMPT.format(text=text, verdict=assessment["verdict"], explanation=assessment["explanation"])
    for model in config.FACTCHECK_MODELS:
        try:
            log.info("Fact-checking with %s", model)
            resp = _chat(model, FACT_SYSTEM, prompt, temperature=0.1, max_tokens=1500)
            data = _extract_json(resp.choices[0].message.content)
            searched = _is_search_model(model)
            sources = _clean_sources(_search_sources(resp) + (data.get("sources") or [])) if searched else []
            facts = data.get("facts")
            return {
                "summary": str(data.get("summary", ""))[:900],
                "facts": [str(f)[:300] for f in facts][:4] if isinstance(facts, list) else [],
                "sources": sources,
                "grounded": bool(sources),
                "model": model,
            }
        except Exception as e:  # noqa: BLE001
            log.warning("Fact-check with %s failed: %s", model, e)
    return None