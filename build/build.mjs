// Builds the whole site into _site/:
//   - copies the hand-written pages and assets listed in config.mjs (STATIC_FILES), nothing else
//   - compiles every notes/*.md into _site/notes/<slug>/index.html
//   - writes the Notes index (notes.html) and the Atom feed (feed.xml)
//   - copies KaTeX's stylesheet and fonts (only the version the compiler uses)
//
// Usage:
//   node build/build.mjs            published notes only (what goes live)
//   node build/build.mjs --drafts   also notes with `draft: true`
//
// Fails (exit code 1) on any error in any note, after listing all of them.

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import matter from "gray-matter";

import { ROOT, STATIC_FILES } from "./config.mjs";
import { compileMarkdown } from "./markdown.mjs";
import { notePage, notesIndexPage, atomFeed } from "./templates.mjs";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Read, validate and compile one note file. Drafts are skipped unless `drafts` is set. */
async function loadNote(file, { relPath, drafts }) {
  const raw = await fs.readFile(file, "utf8");
  const errors = [];
  const slug = path.basename(file, ".md");
  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`${relPath}  File name must be lowercase words joined by hyphens (it becomes the URL /notes/<name>/).`);
  }

  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return { errors: [`${relPath}  Front matter (the --- block at the top) is not valid YAML: ${e.message}`], warnings: [] };
  }
  const meta = parsed.data;
  // A draft never blocks publishing: in a published build it is not even compiled.
  if (meta.draft === true && !drafts) return { skipped: true, errors: [], warnings: [] };
  const lineOffset = raw.slice(0, raw.length - parsed.content.length).split("\n").length - 1;

  const asDate = (value, field) => {
    if (value === undefined) return undefined;
    const d = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(d.getTime())) {
      errors.push(`${relPath}  "${field}: ${value}" is not a date. Use YYYY-MM-DD.`);
      return undefined;
    }
    return d;
  };

  if (typeof meta.title !== "string" || !meta.title.trim()) errors.push(`${relPath}  Front matter needs a title.`);
  if (meta.date === undefined) errors.push(`${relPath}  Front matter needs a date (YYYY-MM-DD).`);
  const date = asDate(meta.date, "date");
  const updated = asDate(meta.updated, "updated");
  if (meta.description !== undefined && typeof meta.description !== "string") {
    errors.push(`${relPath}  "description" must be text.`);
  }
  if (meta.draft !== undefined && typeof meta.draft !== "boolean") {
    errors.push(`${relPath}  "draft" must be true or false.`);
  }
  const known = new Set(["title", "date", "updated", "description", "draft"]);
  const unknown = Object.keys(meta).filter((k) => !known.has(k));
  if (unknown.length) errors.push(`${relPath}  Unknown front matter field(s): ${unknown.join(", ")}. Allowed: ${[...known].join(", ")}.`);

  const compiled = await compileMarkdown(parsed.content, { path: relPath, lineOffset });
  return {
    note: {
      slug,
      title: meta.title,
      description: meta.description,
      date,
      updated,
      draft: meta.draft === true,
      html: compiled.html,
      hasMath: compiled.hasMath,
    },
    errors: [...errors, ...compiled.errors],
    warnings: compiled.warnings,
  };
}

/**
 * Build the site.
 * @param {object} [o]
 * @param {boolean} [o.drafts]   include draft notes
 * @param {string} [o.rootDir]   repo root (tests point this at a fixture)
 * @param {string} [o.outDir]    output directory
 * @param {string[]} [o.staticFiles]
 * @returns {Promise<{ok: boolean, errors: string[], warnings: string[], notes: object[]}>}
 */
export async function build({
  drafts = false,
  rootDir = ROOT,
  outDir = path.join(ROOT, "_site"),
  staticFiles = STATIC_FILES,
} = {}) {
  const errors = [];
  const warnings = [];

  // 1. Notes
  const notesDir = path.join(rootDir, "notes");
  let files = [];
  try {
    files = (await fs.readdir(notesDir)).filter((f) => f.endsWith(".md")).sort();
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  const loaded = await Promise.all(
    files.map((f) => loadNote(path.join(notesDir, f), { relPath: path.join("notes", f), drafts })),
  );
  let notes = [];
  for (const r of loaded) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    if (r.note) notes.push(r.note);
  }
  notes.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.slug.localeCompare(b.slug));

  // 2. Static files (checked before writing anything)
  for (const f of staticFiles) {
    try {
      await fs.access(path.join(rootDir, f));
    } catch {
      errors.push(`${f}  Listed in STATIC_FILES (build/config.mjs) but missing.`);
    }
  }

  if (errors.length) return { ok: false, errors, warnings, notes };

  // 3. Write the site from scratch
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  for (const f of staticFiles) {
    await fs.mkdir(path.dirname(path.join(outDir, f)), { recursive: true });
    await fs.copyFile(path.join(rootDir, f), path.join(outDir, f));
  }
  for (const note of notes) {
    const dir = path.join(outDir, "notes", note.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), notePage(note));
  }
  await fs.writeFile(path.join(outDir, "notes.html"), notesIndexPage(notes));
  // The feed only ever lists published notes, even in a drafts build.
  await fs.writeFile(path.join(outDir, "feed.xml"), atomFeed(notes.filter((n) => !n.draft)));

  // 4. KaTeX stylesheet + fonts, from the exact KaTeX package rehype-katex renders with
  const require = createRequire(import.meta.url);
  const katexDist = path.join(path.dirname(require.resolve("katex/package.json")), "dist");
  const katexOut = path.join(outDir, "assets", "katex");
  await fs.mkdir(path.join(katexOut, "fonts"), { recursive: true });
  await fs.copyFile(path.join(katexDist, "katex.min.css"), path.join(katexOut, "katex.min.css"));
  for (const font of await fs.readdir(path.join(katexDist, "fonts"))) {
    if (font.endsWith(".woff2")) await fs.copyFile(path.join(katexDist, "fonts", font), path.join(katexOut, "fonts", font));
  }

  return { ok: true, errors, warnings, notes };
}

// Command line
if (import.meta.url === `file://${process.argv[1]}`) {
  const drafts = process.argv.includes("--drafts");
  const started = Date.now();
  const result = await build({ drafts });
  for (const w of result.warnings) console.warn(`warning  ${w}`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`error    ${e}`);
    console.error(`\nBuild failed: ${result.errors.length} error(s). Nothing was written.`);
    process.exit(1);
  }
  console.log(
    `Built _site/ in ${Date.now() - started} ms: ${result.notes.length} note(s)${drafts ? " (drafts included)" : ""}.`,
  );
}
