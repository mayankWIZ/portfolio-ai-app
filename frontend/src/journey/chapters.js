// The Journey's chapters. Every fact here is read from profile.json; this file only decides
// order, which highlights to feature, which object in the 3D diorama reveals each one,
// and which agent stands at the station.
import profile from "../data/profile.json";

const job = (company) => profile.experience.find((e) => e.company === company);
const metric = (value) => profile.metrics.find((m) => m.value === value);

const uni = profile.education[0];
const school = profile.education[1];
const freelance = job("Self-Employed");
const hhax = job("HHAeXchange");
const sourcewiz = job("Sourcewiz");
const crest = job("Crest Data");
const ct = job("CognitivTrust");
const skillCount = Object.values(profile.skills).reduce((n, g) => n + g.length, 0);

/**
 * kind: which diorama renders the station (see Stations.jsx)
 * inspect: [{ label, text }] – each is an object in the diorama; inspecting it reveals `text`.
 * toggle: optional scene switch shown in the panel (the diorama reads it).
 */
export const CHAPTERS = [
  {
    id: "education",
    kind: "campus",
    short: "Education",
    title: uni.school.split(",")[0],
    role: uni.degree,
    period: uni.period,
    year: "2017",
    agent: "welcome",
    question: "Where did he study?",
    narration:
      "Every system starts with fundamentals. Mayank studied Computer Engineering in Nadiad, Gujarat, after strong school results in Gandhinagar and Dhandhuka.",
    metrics: [
      { value: "7.0", label: "CGPA, B.Tech Computer Engineering" },
      { value: "87.63%", label: "12th grade" },
      { value: "3", label: "languages spoken" },
    ],
    inspect: [
      { label: "Diploma", text: `${uni.degree}, ${uni.school} (${uni.period}).` },
      { label: "School bell", text: `${school.degree} at ${school.school} (${school.period}).` },
      { label: "Notice board", text: `Certifications: ${profile.certifications.slice(0, 2).join(" · ")}.` },
    ],
    tech: profile.languages,
  },
  {
    id: "freelance",
    kind: "homeOffice",
    short: "Freelance",
    title: "Freelance backend engineer",
    role: freelance.role,
    period: freelance.period,
    year: "2020",
    agent: "client",
    question: "Tell me about his freelance work",
    narration: "Straight out of college, a home office and a laptop: independent backend work for real clients, on time and on budget.",
    metrics: [
      { value: "10+", label: "projects delivered" },
      { value: "30%", label: "faster client response times" },
    ],
    inspect: [
      { label: "Workstation", text: freelance.highlights[0] },
      { label: "Speed gauge", text: freelance.highlights[1] },
      { label: "Whiteboard", text: freelance.highlights[2] },
    ],
    tech: freelance.tech,
  },
  {
    id: "hhaexchange",
    kind: "homeCare",
    short: "HHAeXchange",
    title: "HHAeXchange",
    role: hhax.role,
    period: hhax.period,
    year: "2020",
    agent: "career",
    question: "Tell me about his time at HHAeXchange",
    narration: `${hhax.summary} Reliability here meant caregivers and patients were not left waiting.`,
    metrics: [
      { value: "90%+", label: "of US counties on the platform" },
      { value: "35%", label: "less testing time via automation" },
    ],
    toggle: { label: "Run the Selenium test suite", on: "Tests running", off: "Tests idle" },
    inspect: [
      { label: "Patient records server", text: hhax.highlights[0] },
      { label: "Coverage map", text: hhax.highlights[1] },
      { label: "Test robot", text: hhax.highlights[2] },
    ],
    tech: hhax.tech,
  },
  {
    id: "sourcewiz",
    kind: "warehouse",
    short: "Sourcewiz",
    title: "Sourcewiz",
    role: sourcewiz.role,
    period: sourcewiz.period,
    year: "2022",
    agent: "project",
    question: "Tell me about his time at Sourcewiz",
    narration: `${sourcewiz.summary} Exports run on schedules, so Mayank automated the schedules.`,
    metrics: [
      { value: "40%", label: "less manual reporting time" },
      { value: "200+", label: "B2B clients served" },
    ],
    toggle: { label: "Send WhatsApp alerts", on: "Alerts flowing", off: "Alerts paused" },
    inspect: [
      { label: "Scheduler clock", text: sourcewiz.highlights[0] },
      { label: "Message mast", text: sourcewiz.highlights[1] },
      { label: "Shipping containers", text: sourcewiz.highlights[4] },
    ],
    tech: sourcewiz.tech,
  },
  {
    id: "crest",
    kind: "dataCenter",
    short: "Crest Data",
    title: "Crest Data",
    role: crest.role,
    period: crest.period,
    year: "2023",
    agent: "project",
    question: "Tell me about his time at Crest Data",
    narration: `${crest.summary} This is where scale got serious: queues, workers and pipelines that never sleep.`,
    metrics: [metric("300K+"), metric("1M+"), metric("7K+"), metric("25+")],
    toggle: { label: "Simulate a traffic burst", on: "Burst: 3× events", off: "Steady traffic" },
    inspect: [
      { label: "Event pipeline", text: crest.highlights[0] },
      { label: "Plugin rack", text: crest.highlights[2] },
      { label: "Cloud stack", text: crest.highlights[5] },
      { label: "Team table", text: crest.highlights[6] },
    ],
    tech: crest.tech,
  },
  {
    id: "cognitivtrust",
    kind: "gateway",
    short: "CognitivTrust",
    title: "CognitivTrust",
    role: ct.role,
    period: ct.period,
    year: "2026",
    agent: "research",
    question: "Tell me about the AI governance gateway",
    narration: `${ct.summary} Watch requests from developer IDEs pass through the policy gate.`,
    metrics: [
      { value: "0→1", label: "AI governance platform" },
      { value: "Real-time", label: "policy enforcement" },
      { value: "Zero-config", label: "gateway for IDE AI traffic" },
    ],
    toggle: { label: "Enforce policy", on: "Enforcing: risky requests blocked", off: "Monitor only" },
    inspect: [
      { label: "Policy gate", text: ct.highlights[3] },
      { label: "Context library", text: ct.highlights[4] },
      { label: "Observability wall", text: ct.highlights[6] },
      { label: "Founder's desk", text: ct.highlights[0] },
    ],
    tech: ct.tech,
  },
  {
    id: "projects",
    kind: "gallery",
    short: "Projects",
    title: "Projects showcase",
    role: `${profile.projects.length} systems and side projects`,
    period: "2020 – present",
    year: "★",
    agent: "project",
    question: "List his projects",
    narration: "A gallery of what was built along the way. Each pedestal holds one project; inspect them to read more.",
    metrics: [{ value: String(profile.projects.length), label: "projects on display" }, metric("30%")],
    inspect: profile.projects.map((p) => ({ label: p.name, text: p.summary, link: p.github })),
    tech: [...new Set(profile.projects.flatMap((p) => p.tech))].slice(0, 10),
  },
  {
    id: "skills",
    kind: "skillGarden",
    short: "Skills",
    title: "The skill garden",
    role: `${skillCount} skills across ${Object.keys(profile.skills).length} groups`,
    period: "7+ years",
    year: "◆",
    agent: "career",
    question: "Does he know Kubernetes?",
    narration: "Each pillar is a skill group, as tall as the toolkit inside it. Inspect a pillar to list what's in it.",
    metrics: [
      { value: String(skillCount), label: "skills" },
      { value: String(Object.keys(profile.skills).length), label: "skill groups" },
      metric("7+"),
    ],
    inspect: Object.entries(profile.skills).map(([group, items]) => ({ label: group, text: items.join(" · ") })),
    tech: [],
  },
  {
    id: "services",
    kind: "studio",
    short: "Services & Research",
    title: "Services & Research",
    role: "How Mayank can help, and what he's exploring",
    period: "Now",
    year: "✦",
    agent: "client",
    agent2: "research",
    question: "What services does he offer?",
    question2: "What are his research interests?",
    narration: "Four ways to work together, and a telescope pointed at what's next.",
    metrics: [
      { value: String(profile.services.length), label: "service areas" },
      { value: String(profile.research_interests.length), label: "research interests" },
    ],
    inspect: [
      ...profile.services.map((s) => ({ label: s.name, text: s.description })),
      { label: "Telescope", text: `Research interests: ${profile.research_interests.join(" · ")}.` },
    ],
    tech: [],
  },
  {
    id: "finale",
    kind: "finale",
    short: "Finale",
    title: "The view from here",
    role: profile.title,
    period: "Today",
    year: "∞",
    agent: "welcome",
    question: "Which agent should I talk to?",
    narration: profile.summary,
    metrics: profile.metrics,
    inspect: [],
    tech: [],
  },
];

export const FINALE_INDEX = CHAPTERS.length - 1;

/** "300K+" → { n: 300, prefix: "", suffix: "K+", decimals: 0 }; non-numeric values return null. */
export function parseMetric(value) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  if (!m || m[3].startsWith("→")) return null;
  return { prefix: m[1], n: parseFloat(m[2]), suffix: m[3], decimals: (m[2].split(".")[1] || "").length };
}
