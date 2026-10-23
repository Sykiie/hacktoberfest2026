import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const requiredFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "LICENSE",
];
const markdownRoots = [
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "openspec/specs",
];

function listMarkdownFiles(target) {
  if (!existsSync(target)) return [];
  const stats = statSync(target);
  if (stats.isFile()) return target.toLowerCase().endsWith(".md") ? [target] : [];
  if (!stats.isDirectory()) return [];
  const entries = readdirSync(target, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(child);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [child] : [];
  });
}

const missingFiles = requiredFiles.filter((file) => !existsSync(file));
const brokenLinks = [];

for (const markdownFile of markdownRoots.flatMap(listMarkdownFiles)) {
  const source = readFileSync(markdownFile, "utf8");
  const links = source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const [, rawTarget] of links) {
    const target = rawTarget.trim().split(/\s+/, 1)[0];
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)) continue;
    const relativeTarget = decodeURIComponent(target.split(/[?#]/, 1)[0]);
    if (!relativeTarget) continue;
    const absoluteTarget = path.resolve(path.dirname(markdownFile), relativeTarget);
    if (!existsSync(absoluteTarget)) brokenLinks.push(`${markdownFile}: ${target}`);
  }
}

if (missingFiles.length || brokenLinks.length) {
  for (const file of missingFiles) console.error(`Missing required documentation file: ${file}`);
  for (const link of brokenLinks) console.error(`Broken documentation link: ${link}`);
  process.exitCode = 1;
} else {
  console.log("Required project documentation and relative links are present.");
}
