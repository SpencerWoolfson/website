// Tests for the whole-site build, using a throwaway copy of a tiny site.  Run: npm test

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "../build.mjs";

let root;
let out;
const STATIC = ["index.html", "style.css"];

async function write(rel, text) {
  await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true });
  await fs.writeFile(path.join(root, rel), text);
}

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "site-test-"));
  out = path.join(root, "_site");
  await write("index.html", "<p>home</p>");
  await write("style.css", "body{}");
  await write("secret.md", "private");
  await write("notes/older.md", "---\ntitle: Older\ndate: 2026-01-02\n---\n\nText.");
  await write("notes/newer.md", "---\ntitle: Newer <b>\ndate: 2026-03-04\ndescription: About $x$.\n---\n\nHas $x^2$.");
  await write("notes/wip.md", "---\ntitle: WIP\ndate: 2026-05-06\ndraft: true\n---\n\nBroken $\\frac{$ math.");
});

after(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

test("published build: only allowlisted files, notes, index, feed", async () => {
  const r = await build({ rootDir: root, outDir: out, staticFiles: STATIC });
  assert.equal(r.ok, true, r.errors.join("\n"));
  await fs.access(path.join(out, "index.html"));
  await fs.access(path.join(out, "notes/older/index.html"));
  await fs.access(path.join(out, "notes/newer/index.html"));
  await fs.access(path.join(out, "assets/katex/katex.min.css"));
  const notemarkCss = await fs.readFile(path.join(out, "assets/notemark.css"), "utf8");
  assert.ok(notemarkCss.includes("--nm-code-keyword"), "palette stylesheet generated");
  await assert.rejects(fs.access(path.join(out, "secret.md")), "files outside the allowlist are never copied");
  await assert.rejects(fs.access(path.join(out, "notes/newer.md")), "note sources are not published");
  await assert.rejects(fs.access(path.join(out, "notes/wip/index.html")), "drafts are not published");
});

test("a broken draft does not block a published build", async () => {
  const r = await build({ rootDir: root, outDir: out, staticFiles: STATIC });
  assert.equal(r.ok, true);
});

test("drafts build includes the draft and reports its errors", async () => {
  const r = await build({ rootDir: root, outDir: out, staticFiles: STATIC, drafts: true });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.startsWith("notes/wip.md:7:") && e.includes("Math error")), r.errors.join("\n"));
});

test("notes index is newest first, escapes titles, and loads KaTeX only where needed", async () => {
  await build({ rootDir: root, outDir: out, staticFiles: STATIC });
  const index = await fs.readFile(path.join(out, "notes.html"), "utf8");
  assert.ok(index.indexOf("Newer") < index.indexOf("Older"));
  assert.ok(index.includes("Newer &lt;b&gt;"));
  assert.ok(index.includes('aria-current="page"'));
  const newer = await fs.readFile(path.join(out, "notes/newer/index.html"), "utf8");
  const older = await fs.readFile(path.join(out, "notes/older/index.html"), "utf8");
  assert.ok(newer.includes("katex.min.css"));
  assert.ok(!older.includes("katex.min.css"));
  assert.ok(newer.includes('<a href="/notes.html" aria-current="true">Notes</a>'));
  assert.ok(newer.includes('<div class="post-body notemark">') && newer.includes("/assets/notemark.css"));
});

test("feed lists published notes only", async () => {
  await build({ rootDir: root, outDir: out, staticFiles: STATIC, drafts: false });
  const feed = await fs.readFile(path.join(out, "feed.xml"), "utf8");
  assert.ok(feed.includes("/notes/newer/") && feed.includes("/notes/older/"));
  assert.ok(!feed.includes("/notes/wip/"));
});

test("bad front matter and file names are reported", async () => {
  await write("notes/Bad Name.md", "---\ntitle: X\ndate: 2026-01-01\n---\nx");
  await write("notes/no-date.md", "---\ntitle: X\ntags: [a]\n---\nx");
  const r = await build({ rootDir: root, outDir: out, staticFiles: STATIC });
  await fs.rm(path.join(root, "notes/Bad Name.md"));
  await fs.rm(path.join(root, "notes/no-date.md"));
  assert.equal(r.ok, false);
  const all = r.errors.join("\n");
  assert.match(all, /Bad Name\.md .*File name/);
  assert.match(all, /no-date\.md .*needs a date/);
  assert.match(all, /no-date\.md .*Unknown front matter field\(s\): tags/);
});

test("a missing allowlisted file fails the build and writes nothing", async () => {
  await fs.rm(out, { recursive: true, force: true });
  const r = await build({ rootDir: root, outDir: out, staticFiles: [...STATIC, "missing.html"] });
  assert.equal(r.ok, false);
  await assert.rejects(fs.access(out));
});
