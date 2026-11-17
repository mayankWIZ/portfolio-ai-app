// The town's agents. Names, roles and buildings match bot/portfolio/engine.py in the PyBot fork.
export const AGENTS = [
  {
    key: "welcome",
    name: "Ava",
    role: "Concierge",
    building: "Town Hall",
    color: "#38bdf8",
    position: [0, 0, 0],
    blurb: "A quick overview of Mayank, and which agent to visit next.",
    greeting:
      "Hi, I'm **Ava**, the concierge. Mayank is a Head of Engineering with 7+ years in distributed systems and AI platforms. Are you hiring, looking for help on a project, or a fellow engineer?",
    suggestions: ["Who is Mayank?", "What is he working on now?", "Which agent should I talk to?"],
  },
  {
    key: "career",
    name: "Theo",
    role: "Career Advisor",
    building: "Career HQ",
    color: "#a78bfa",
    position: [-7, 0, -3],
    blurb: "Experience, skills, seniority, and a job-description fit check.",
    greeting:
      "I'm **Theo** from Career HQ. Ask about Mayank's experience or skills, or **paste a job description** and I'll check the fit.",
    suggestions: ["Summarise his experience", "Does he know Kubernetes?", "Why should we hire him?"],
  },
  {
    key: "project",
    name: "Nova",
    role: "Project Lead",
    building: "Engineering Lab",
    color: "#34d399",
    position: [7, 0, -3],
    blurb: "Systems and projects: architecture, scale and stack.",
    greeting:
      "I'm **Nova** from the Engineering Lab. I can walk you through Mayank's systems, from the AI governance gateway to 300K events/min pipelines.",
    suggestions: ["List his projects", "Tell me about the AI governance gateway", "How did he handle 300K events/min?"],
  },
  {
    key: "client",
    name: "Max",
    role: "Business Advisor",
    building: "Services Studio",
    color: "#fbbf24",
    position: [-5.5, 0, 6],
    blurb: "Services, how an engagement works, and how to get a quote.",
    greeting:
      "I'm **Max** from the Services Studio. Tell me what you're building and I'll explain how Mayank can help.",
    suggestions: ["What services does he offer?", "How does an engagement work?", "How do I get a quote?"],
  },
  {
    key: "research",
    name: "Iris",
    role: "Research Analyst",
    building: "Research Tower",
    color: "#f472b6",
    position: [5.5, 0, 6],
    blurb: "AI governance, RAG, agents & MCP, and rule-based bots.",
    greeting:
      "I'm **Iris** from the Research Tower. Let's talk AI governance, RAG, agents, or how this town runs without an LLM.",
    suggestions: ["What is AI governance?", "What are his research interests?", "Are you an LLM?"],
  },
];

export const AGENT_BY_KEY = Object.fromEntries(AGENTS.map((a) => [a.key, a]));
