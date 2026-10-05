// Generates AI-facing assets from the Claude Code skill so there is a single source of truth:
// - docs/public/llms.txt                       -> SKILL.md + every reference, one plain-text file
// - docs/public/skills/teken-heula-api/**      -> downloadable copy of the skill folder
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "plugins/teken-heula-api/skills/teken-heula-api");
const publicDir = join(root, "docs/public");

const stripFrontmatter = (markdown) => markdown.replace(/^---\n[\s\S]*?\n---\n/, "");

const referencesDir = join(skillDir, "references");
const references = readdirSync(referencesDir)
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => `\n\n<!-- references/${file} -->\n\n${readFileSync(join(referencesDir, file), "utf8").trim()}`);

const llms = [
  "<!-- Dihasilkan otomatis dari plugins/teken-heula-api/skills/teken-heula-api oleh scripts/build-ai-assets.mjs. Jangan edit manual. -->",
  "",
  stripFrontmatter(readFileSync(join(skillDir, "SKILL.md"), "utf8")).trim(),
  ...references,
  "",
].join("\n");

writeFileSync(join(publicDir, "llms.txt"), llms);

const skillTarget = join(publicDir, "skills/teken-heula-api");
rmSync(skillTarget, { recursive: true, force: true });
mkdirSync(dirname(skillTarget), { recursive: true });
cpSync(skillDir, skillTarget, { recursive: true });

console.log("AI assets generated: docs/public/llms.txt, docs/public/skills/teken-heula-api/");
