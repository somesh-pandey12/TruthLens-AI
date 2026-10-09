import hashlib
import hmac
import logging

from flask import Flask, jsonify, request
from flask_cors import CORS

import config
import llm
import nlp
from cache import TTLCache

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = Flask(__name__)
CORS(app, origins=config.ALLOWED_ORIGINS)
cache = TTLCache(config.CACHE_MAX_ITEMS, config.CACHE_TTL_SECONDS)


@app.before_request
def check_api_key():
    """Agar ML_API_KEY set hai to sirf wahi caller allow hoga jiske paas key ho (/health open hai)."""
    if not config.ML_API_KEY or request.path == "/health" or request.method == "OPTIONS":
        return None
    sent = request.headers.get("x-api-key", "")
    if not hmac.compare_digest(sent, config.ML_API_KEY):
        return jsonify({"error": "unauthorized"}), 401
    return None


@app.get("/health")
def health():
    return jsonify({"status": "ok", "mock": config.MOCK_LLM, "models": config.GROQ_MODELS})


@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    text = nlp.clean_text(data.get("text", ""), config.MAX_TEXT_CHARS)
    url = str(data.get("url") or "")[:500]

    if len(text) < 10:
        return jsonify({"error": "Text too short"}), 400

    key = hashlib.sha256(f"{text}|{url}".encode()).hexdigest()
    cached = cache.get(key)
    if cached:
        return jsonify({**cached, "cached": True})

    features = nlp.sentiment_features(text)
    try:
        result, model = llm.assess(text, url, features)
    except llm.RateLimited as rl:
        resp = jsonify({"error": "rate_limited", "retryAfter": rl.retry_after})
        resp.status_code = 429
        resp.headers["Retry-After"] = str(rl.retry_after)
        return resp
    except llm.LLMError as e:
        logging.getLogger("api").error("LLM failure: %s", e)
        return jsonify({"error": "ai_unavailable", "details": str(e)}), 502
    except Exception:  # noqa: BLE001
        logging.getLogger("api").exception("Unexpected error")
        return jsonify({"error": "internal_error"}), 500

    truth = None
    if config.ENABLE_FACTCHECK and result["verdict"] in ("FAKE", "UNCERTAIN"):
        truth = llm.fact_check(text, result)

    payload = {**result, "sentiment": features["sentiment"],
               "subjectivity": features["subjectivity"], "model": model, "truth": truth}
    cache.set(key, payload)
    return jsonify({**payload, "cached": False})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=False)