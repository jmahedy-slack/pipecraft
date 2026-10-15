#!/usr/bin/env node
/**
 * Rebuild vendor/three.min.js as a tree-shaken Three.js r160 containing only the
 * THREE.* symbols referenced by pipecraft-game.js (keeps Homepage.html under
 * Slack's ~1 MB setView limit). Re-run after using a new THREE class.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = readFileSync(join(ROOT, "pipecraft-game.js"), "utf8");
const names = [...new Set(game.match(/THREE\.\w+/g).map((n) => n.slice(6)))].sort();

const work = mkdtempSync(join(tmpdir(), "pipecraft-three-"));
execSync("npm init -y && npm i --silent three@0.160.0", { cwd: work, stdio: "ignore" });
writeFileSync(join(work, "entry.js"), `import { ${names.join(", ")} } from "three";\nwindow.THREE = { ${names.join(", ")} };\n`);
execSync(`npx -y esbuild@0.28.2 entry.js --bundle --minify --format=iife --log-level=error --outfile=${join(ROOT, "vendor/three.min.js")}`, { cwd: work, stdio: "inherit" });

const size = readFileSync(join(ROOT, "vendor/three.min.js")).length;
console.log(`✔ vendor/three.min.js rebuilt with ${names.length} symbols (${(size / 1024).toFixed(0)} KB)`);
