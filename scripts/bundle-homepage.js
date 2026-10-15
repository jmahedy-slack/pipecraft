#!/usr/bin/env node
/**
 * Inline vendored Three.js + game logic into Homepage.html for Slack Code preview
 * (setView inlines HTML — external script src paths do not resolve in-channel).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const html = readFileSync(join(ROOT, "pipecraft.html"), "utf8");
const three = readFileSync(join(ROOT, "vendor/three.min.js"), "utf8");
const game = readFileSync(join(ROOT, "pipecraft-game.js"), "utf8");
const heroDataUri = `data:image/jpeg;base64,${readFileSync(join(ROOT, "assets/title-hero.jpg")).toString("base64")}`;

const bundled = html
  .replace('<script src="vendor/three.min.js"></script>', () => `<script>\n${three}\n</script>`)
  .replace('<script src="pipecraft-game.js"></script>', () => `<script>\n${game}\n</script>`)
  .replace('url("assets/title-hero.jpg")', () => `url("${heroDataUri}")`);

writeFileSync(join(ROOT, "Homepage.html"), bundled, "utf8");
console.log(`✔ Homepage.html bundled (${(bundled.length / 1024).toFixed(0)} KB)`);
