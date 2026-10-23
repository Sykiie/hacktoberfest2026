import { readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["server", "shared", "tests", "scripts", "vite.config.js"];

function listJavaScriptFiles(target) {
  const absolutePath = path.resolve(target);
  const stats = readdirSync(path.dirname(absolutePath), { withFileTypes: true })
    .find((entry) => entry.name === path.basename(absolutePath));

  if (!stats) return [];
  if (stats.isFile()) return /\.(?:c|m)?js$/i.test(target) ? [target] : [];
  if (!stats.isDirectory()) return [];

  return readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => listJavaScriptFiles(path.join(target, entry.name)));
}

const files = [...new Set(roots.flatMap(listJavaScriptFiles))].sort();
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status === 0) continue;
  failed = true;
  process.stderr.write(`${file}\n${result.stderr || result.stdout}`);
}

if (failed) process.exitCode = 1;
else console.log(`Syntax check passed for ${files.length} JavaScript files.`);
