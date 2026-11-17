"""The portfolio chat, powered entirely by PyBot (github.com/mayankWIZ/pybot, branch with bot/portfolio).

No LLM, no API key. A turn goes:
  1. bot.portfolio.engine: Mayank's CV as rules. Milliseconds, deterministic, never invents facts.
  2. bot.runtime: the rest of PyBot (~640k lines of rules) for small talk and general questions.

PYBOT_PATH points at the fork's clone (the folder that contains `bot/`). The runtime takes a few
seconds and ~250 MB to load, so it is loaded once, in a background thread, at startup.
"""
import logging
import os
import sys
import threading
import time
from collections import OrderedDict

log = logging.getLogger(__name__)

AGENTS = ("welcome", "career", "project", "client", "research")
MAX_SESSIONS = 500
SESSION_TTL = 2 * 60 * 60  # seconds
TURN_LOCK_WAIT = 12.0
MAX_SMALL_TALK = 300  # characters passed to the full PyBot runtime

_engine = None
_runtime = None
_runtime_ready = threading.Event()
_lock = threading.Lock()  # PyBot's memory is plain dicts: one turn at a time
_sessions = OrderedDict()  # session id -> (last_seen, memory)


def _add_path():
    path = os.environ.get("PYBOT_PATH") or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "pybot")
    if not os.path.isdir(os.path.join(path, "bot", "portfolio")):
        raise RuntimeError(f"PYBOT_PATH={path!r} is not a clone of the pybot fork with bot/portfolio")
    if path not in sys.path:
        sys.path.insert(0, path)
    return path


def init():
    """Load the portfolio engine now (fast) and the full PyBot runtime in the background."""
    global _engine
    path = _add_path()
    from bot.portfolio import engine  # noqa: PLC0415

    _engine = engine
    log.info("Portfolio engine loaded from %s", path)
    if os.environ.get("PYBOT_FULL", "1") == "1":
        threading.Thread(target=_load_runtime, name="pybot-loader", daemon=True).start()
    else:
        _runtime_ready.set()


def _load_runtime():
    global _runtime
    started = time.perf_counter()
    try:
        from bot import runtime  # noqa: PLC0415 - heavy, deliberately deferred

        _runtime = runtime
        log.info("PyBot runtime loaded in %.1fs", time.perf_counter() - started)
    except Exception:  # noqa: BLE001
        log.exception("PyBot runtime failed to load; the chat will answer CV questions only")
    finally:
        _runtime_ready.set()


def status():
    if _engine is None:
        return "down"
    if not _runtime_ready.is_set():
        return "loading"
    return "ready" if _runtime else "cv-only"


def profile():
    return _engine.P


def suggestions(agent):
    return list(_engine.SUGGEST.get(agent, _engine.SUGGEST["welcome"]))


def agents():
    return [
        {"key": key, "name": n, "role": r, "building": b, "suggestions": suggestions(key)}
        for key, (n, r, b) in _engine.AGENTS.items()
    ]


def _session(session_id):
    now = time.time()
    for key in [k for k, (seen, _) in _sessions.items() if now - seen > SESSION_TTL]:
        del _sessions[key]
    _, memory = _sessions.pop(session_id, (now, None))
    memory = memory if memory is not None else {}
    _sessions[session_id] = (now, memory)
    while len(_sessions) > MAX_SESSIONS:
        _sessions.popitem(last=False)
    return memory


def chat(text, agent, session_id):
    """{"reply", "source", "module", "suggestions"} for one visitor line."""
    agent = agent if agent in AGENTS else "welcome"
    if not _lock.acquire(timeout=TURN_LOCK_WAIT):
        return {"reply": "I'm talking to a lot of visitors right now. Give me a second and ask again.",
                "source": "busy", "module": None, "suggestions": suggestions(agent)}
    try:
        memory = _session(f"{session_id}:{agent}")
        memory["portfolio_agent"] = agent
        memory.pop("portfolio_suggestions", None)

        reply = _engine.answer(text, memory)
        if reply:
            turns = memory.setdefault("turns", [])
            turns.append({"user": text, "bot": reply, "module": "portfolio"})
            del turns[:-50]
            return {"reply": reply, "source": "portfolio", "module": "portfolio",
                    "suggestions": memory.get("portfolio_suggestions") or suggestions(agent)}

        if _runtime is None:
            _runtime_ready.wait(8)
        # Long free text that isn't a CV question would run every PyBot module for many seconds.
        if _runtime is not None and len(text) <= MAX_SMALL_TALK:
            try:
                result = _runtime.turn(text, memory)
                reply = str(result.get("reply") or "").strip()
                if reply and reply != "Hello!":
                    return {"reply": reply, "source": "pybot", "module": result.get("module"),
                            "suggestions": suggestions(agent)}
            except Exception:  # noqa: BLE001
                log.exception("PyBot turn failed")
        name = _engine.AGENTS[agent][0]
        return {"reply": (f"I'm {name}, and I'm best at questions about {_engine.FIRST}'s work. "
                          "Try one of the suggestions below."),
                "source": "fallback", "module": None, "suggestions": suggestions(agent)}
    finally:
        _lock.release()
