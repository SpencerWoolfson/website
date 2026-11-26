// Local preview: builds with drafts, serves _site/ on http://localhost:8765,
// and rebuilds whenever a note, page, stylesheet or the compiler changes.
// Reload the browser to see the result; build errors are printed here.
//
//   npm run dev

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./config.mjs";

const PORT = Number(process.env.PORT ?? 8765);
const OUT = path.join(ROOT, "_site");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

let building = false;
let again = false;

async function rebuild(reason) {
  if (building) {
    again = true;
    return;
  }
  building = true;
  try {
    // Re-import the compiler each time so edits to build/*.mjs take effect without a restart.
    const { build } = await import(`./build.mjs?t=${Date.now()}`);
    const started = Date.now();
    const result = await build({ drafts: true });
    for (const w of result.warnings) console.warn(`warning  ${w}`);
    if (result.ok) {
      console.log(`[${new Date().toLocaleTimeString()}] built in ${Date.now() - started} ms (${reason})`);
    } else {
      for (const e of result.errors) console.error(`error    ${e}`);
      console.error(`[${new Date().toLocaleTimeString()}] build FAILED (${reason}); serving the last good build`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    building = false;
    if (again) {
      again = false;
      rebuild("more changes");
    }
  }
}

await rebuild("start");

let timer;
for (const target of ["notes", "build", "."]) {
  const dir = path.join(ROOT, target);
  if (!fs.existsSync(dir)) continue;
  fs.watch(dir, { recursive: target !== "." }, (_event, name) => {
    if (!name || name.startsWith("_site") || name.includes("node_modules") || name.startsWith(".git")) return;
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(path.join(target, name)), 80);
  });
}

http
  .createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const file = path.join(OUT, path.normalize(urlPath));
      if (!file.startsWith(OUT)) throw Object.assign(new Error("outside"), { code: "ENOENT" });
      const body = await fsp.readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  })
  .listen(PORT, () => console.log(`Serving _site/ on http://localhost:${PORT}`));
