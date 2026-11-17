import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AGENTS, AGENT_BY_KEY } from "../data/agents";
import { sendChat } from "../lib/api";

const SOURCE_LABEL = {
  portfolio: "CV engine",
  pybot: "PyBot",
  fallback: "PyBot",
  busy: "busy",
};

function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/** Conversations persist per agent for the visit, so switching buildings doesn't lose context. */
const threads = {};

export default function AgentChat({ agentKey, onSwitch, onClose, pendingQuestion, onPendingConsumed }) {
  const agent = AGENT_BY_KEY[agentKey] || AGENTS[0];
  const [messages, setMessages] = useState(() => threads[agent.key] || [{ role: "agent", text: agent.greeting }]);
  const [suggestions, setSuggestions] = useState(agent.suggestions);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const scroller = useRef(null);
  const inputRef = useRef(null);

  // The parent remounts this component per agent (key={agentKey}), so state starts from that agent's thread.
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    threads[agent.key] = messages;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, agent.key]);

  async function ask(text) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    const slowTimer = setTimeout(() => setSlow(true), 3500);
    try {
      const res = await sendChat(message, agent.key);
      setMessages((m) => [...m, { role: "agent", text: res.reply, source: res.source, ms: res.ms }]);
      if (res.suggestions?.length) setSuggestions(res.suggestions.filter((s) => s.toLowerCase() !== message.toLowerCase()));
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          error: true,
          text:
            err.status === 429
              ? "That's a lot of questions at once. Give me a minute."
              : "I couldn't reach the town's server. It may be waking up (free hosting sleeps when idle). Please try again in a few seconds.",
        },
      ]);
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setBusy(false);
    }
  }

  // A question sent from elsewhere on the page ("Ask Nova about this project").
  useEffect(() => {
    if (pendingQuestion && pendingQuestion.agent === agent.key) {
      ask(pendingQuestion.text);
      onPendingConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion, agent.key]);

  return (
    <section className="chat" style={{ "--accent": agent.color }} aria-label={`Chat with ${agent.name}`}>
      <header className="chat__header">
        <div className="chat__avatar">{agent.name[0]}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <span className="chat__role">{agent.role}</span>
          </div>
          <p className="truncate text-xs text-slate-400">{agent.building} · {agent.blurb}</p>
        </div>
        {onClose && (
          <button className="chat__close" onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        )}
      </header>

      <nav className="chat__tabs" aria-label="Agents">
        {AGENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => onSwitch(a.key)}
            className={`chat__tab ${a.key === agent.key ? "chat__tab--on" : ""}`}
            style={{ "--accent": a.color }}
          >
            {a.name}
          </button>
        ))}
      </nav>

      <div ref={scroller} className="chat__log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role} ${m.error ? "bubble--error" : ""}`}>
            <div className="prose-chat">
              <Markdown>{m.text}</Markdown>
            </div>
            {m.source && (
              <div className="bubble__meta">
                {SOURCE_LABEL[m.source] || m.source}
                {typeof m.ms === "number" ? ` · ${m.ms} ms` : ""}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="bubble bubble--agent">
            <span className="typing">
              <i />
              <i />
              <i />
            </span>
            {slow && <span className="ml-2 text-xs text-slate-400">waking the server…</span>}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="chat__chips">
          {suggestions.map((s) => (
            <button key={s} className="chip" disabled={busy} onClick={() => (s.startsWith("Paste") ? inputRef.current?.focus() : ask(s))}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <textarea
          ref={inputRef}
          rows={input.length > 120 ? 4 : 1}
          value={input}
          maxLength={6000}
          placeholder={agent.key === "career" ? "Ask Theo, or paste a job description…" : `Ask ${agent.name}…`}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
        />
        <button type="submit" disabled={busy || !input.trim()} className="chat__send">
          Send
        </button>
      </form>
      <p className="chat__foot">Rule-based answers from Mayank's CV via PyBot. No LLM, nothing made up.</p>
    </section>
  );
}
