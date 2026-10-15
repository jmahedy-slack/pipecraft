#!/usr/bin/env node
/**
 * Minimal static server for Heroku: serves the self-contained Homepage.html at "/"
 * and the unbundled game files (pipecraft.html, assets/, vendor/) for local-style loading.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};
const ALLOWED = /^\/(Homepage\.html|pipecraft\.html|pipecraft-game\.js|assets\/[\w.-]+|vendor\/[\w.-]+)$/;

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path === "/health") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  const file = path === "/" ? "/Homepage.html" : path;
  if (!ALLOWED.test(file)) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  try {
    let body = await readFile(join(ROOT, file));
    const type = TYPES[extname(file)] || "application/octet-stream";
    const headers = { "content-type": type, "cache-control": "public, max-age=300" };
    if (/html|javascript/.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      body = gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
    res.writeHead(200, headers).end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
}).listen(PORT, () => console.log(`Pipecraft listening on ${PORT}`));
