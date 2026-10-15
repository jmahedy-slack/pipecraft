#!/usr/bin/env node
/**
 * Push Homepage.html to the Pipecraft Slack Code channel split pane.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "C0C981J3DH9";

if (!SLACK_BOT_TOKEN) {
  console.error("❌ SLACK_BOT_TOKEN required");
  process.exit(1);
}

const homepagePath = join(ROOT, "Homepage.html");
if (!existsSync(homepagePath)) {
  console.error("❌ Homepage.html missing — run: node scripts/bundle-homepage.js");
  process.exit(1);
}

const htmlContent = readFileSync(homepagePath, "utf8");
const branch = process.env.GITHUB_REF_NAME || execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const commitSha = (process.env.GITHUB_SHA || execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim()).slice(0, 7);

async function sync() {
  console.log(`[Slack] Channel ${CHANNEL_ID} · ${htmlContent.length} bytes HTML`);

  const res = await fetch("https://slack.com/api/agents.conversations.setView", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel_id: CHANNEL_ID,
      type: "html",
      view_key: "homepage.html",
      name: "Homepage",
      content: htmlContent,
    }),
  }).then((r) => r.json());

  if (!res.ok) {
    console.error("❌ setView failed:", res.error);
    process.exit(1);
  }
  console.log("✔ Homepage tab updated — playable in Slack Code");

  await fetch("https://slack.com/api/agents.conversations.removeView", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel_id: CHANNEL_ID, view_key: "preview.html" }),
  }).catch(() => {});

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: CHANNEL_ID,
      text: `⚡ *Homepage synced* (\`${branch}\` @ \`${commitSha}\`) — open the **Homepage** tab, click **Start Adventure**, then click the canvas to capture the mouse.`,
    }),
  });
}

sync();
