// Copy the CV from the PyBot fork, the single source of truth, into src/data/profile.json.
//   node scripts/sync-profile.mjs                 download from GitHub (main branch)
//   node scripts/sync-profile.mjs ../../pybot     copy from a local clone
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const target = new URL("../src/data/profile.json", import.meta.url);
const local = process.argv[2];
const url = "https://raw.githubusercontent.com/mayankWIZ/pybot/main/bot/portfolio/profile.json";

const text = local
  ? await readFile(join(local, "bot/portfolio/profile.json"), "utf8")
  : await fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
      return r.text();
    });
JSON.parse(text); // fail loudly on a broken file
await writeFile(target, text);
console.log(`profile.json synced from ${local || url}`);
