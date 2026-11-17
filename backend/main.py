"""Portfolio API: a thin Flask wrapper around PyBot. No LLM, no API keys.

    GET  /api/health    {"status": "ok", "pybot": "ready" | "loading" | "cv-only"}
    GET  /api/agents    the town's agents and their starter questions
    GET  /api/profile   the CV the chat answers from
    POST /api/chat      {"message", "agent", "session_id"} -> {"reply", "source", "suggestions", ...}
    POST /api/<agent>   legacy {"message"} -> {"response"} (welcome, career, project, client, research)
"""
import logging
import os
import re
import threading
import time
import uuid
from collections import defaultdict, deque

from flask import Flask, jsonify, request
from flask_cors import CORS

from portfolio import pybot_bridge as bot

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

MAX_MESSAGE = 6000
RATE_LIMIT = int(os.environ.get("RATE_LIMIT_PER_MIN", "40"))

app = Flask(__name__)
origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
CORS(app, resources={r"/api/*": {"origins": origins}})

bot.init()

_hits = defaultdict(deque)
_hits_lock = threading.Lock()


def _client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    return forwarded.split(",")[0].strip() or request.remote_addr or "?"


def _rate_limited():
    now, ip = time.time(), _client_ip()
    with _hits_lock:
        q = _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_LIMIT:
            return True
        q.append(now)
        if len(_hits) > 5000:
            _hits.clear()
    return False


def _session_id(raw):
    raw = str(raw or "")
    return raw if re.fullmatch(r"[A-Za-z0-9_-]{8,64}", raw) else uuid.uuid4().hex


@app.get("/")
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "pybot": bot.status()})


@app.get("/api/agents")
def agents():
    return jsonify({"agents": bot.agents()})


@app.get("/api/profile")
def profile():
    return jsonify(bot.profile())


@app.post("/api/chat")
def chat():
    if _rate_limited():
        return jsonify({"error": "Too many messages. Please wait a minute."}), 429
    data = request.get_json(silent=True) or {}
    message = str(data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    message = message[:MAX_MESSAGE]
    session_id = _session_id(data.get("session_id"))
    started = time.perf_counter()
    result = bot.chat(message, str(data.get("agent") or "welcome"), session_id)
    result.update(session_id=session_id, ms=round((time.perf_counter() - started) * 1000))
    return jsonify(result)


@app.post("/api/<agent>")
def legacy(agent):
    if agent not in bot.AGENTS:
        return jsonify({"error": "unknown agent"}), 404
    if _rate_limited():
        return jsonify({"error": "Too many messages. Please wait a minute."}), 429
    data = request.get_json(silent=True) or {}
    message = str(data.get("message") or "").strip()[:MAX_MESSAGE]
    if not message:
        return jsonify({"error": "message is required"}), 400
    result = bot.chat(message, agent, _session_id(data.get("session_id")))
    return jsonify({"response": result["reply"], "source": result["source"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), debug=False, threaded=True)
