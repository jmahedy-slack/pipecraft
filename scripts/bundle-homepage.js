#!/usr/bin/env node
/**
 * Inline vendored Three.js + game logic into Homepage.html for Slack Code preview
 * (setView inlines HTML — external script src paths do not resolve in-channel).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Slack rejects setView HTML above ~1 MB with content_too_large.
const SLACK_VIEW_LIMIT = 1_000_000;

const html = readFileSync(join(ROOT, "pipecraft.html"), "utf8");
const three = readFileSync(join(ROOT, "vendor/three.min.js"), "utf8");
let game = readFileSync(join(ROOT, "pipecraft-game.js"), "utf8");
try {
  game = execSync("npx -y esbuild@0.28.2 --minify --log-level=error", { input: game, cwd: ROOT, encoding: "utf8" });
} catch {
  console.warn("⚠ esbuild unavailable — bundling unminified game code");
}
const heroDataUri = `data:image/webp;base64,${readFileSync(join(ROOT, "assets/title-hero.webp")).toString("base64")}`;

const bundled = html
  .replace('<script src="vendor/three.min.js"></script>', () => `<script>\n${three}\n</script>`)
  .replace('<script src="pipecraft-game.js"></script>', () => `<script>\n${game}\n</script>`)
  .replace('url("assets/title-hero.webp")', () => `url("${heroDataUri}")`);

const bytes = Buffer.byteLength(bundled);
writeFileSync(join(ROOT, "Homepage.html"), bundled, "utf8");
console.log(`✔ Homepage.html bundled (${(bytes / 1024).toFixed(0)} KB)`);
if (bytes > SLACK_VIEW_LIMIT) {
  console.error(`❌ ${bytes} bytes exceeds the Slack Homepage limit (${SLACK_VIEW_LIMIT})`);
  process.exit(1);
}
