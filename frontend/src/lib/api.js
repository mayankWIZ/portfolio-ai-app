const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function sessionId() {
  const key = "agent-town-session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9]/g, "");
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function post(path, body, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** One chat turn. Free hosting may be asleep, so the first call gets a long timeout and one retry. */
export async function sendChat(message, agent) {
  const body = { message, agent, session_id: sessionId() };
  try {
    return await post("/api/chat", body, 45000);
  } catch (err) {
    if (err.status === 429 || err.status === 400) throw err;
    return await post("/api/chat", body, 60000);
  }
}

/** Wake the backend early (free tiers sleep) so the first message is fast. */
export function warmUp() {
  fetch(`${API_BASE}/api/health`).catch(() => {});
}
