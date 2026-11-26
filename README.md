# spencerwoolfson.com

Hand-written HTML pages, plus **Notes**: posts written in our own extended Markdown
and compiled to HTML by the code in [`build/`](build/).

| Path | What it is |
|---|---|
| `index.html`, `research.html`, `formalization.html`, `teaching.html`, `cv.html` | Hand-written pages. Edit the HTML directly. |
| `style.css` | All styling, light and dark mode. |
| `notes/*.md` | Notes. One file per note; the file name becomes the URL `/notes/<name>/`. |
| `build/` | The notes compiler: Markdown pipeline, our extensions, templates, tests. |
| `_site/` | Build output (not in git). This is exactly what gets published. |

`Spencer_Woolfson_Master.md` (the private master record) lives in this folder but is
git-ignored and never committed or published.

## Setup (once)

Needs Node 24 or newer.

```bash
cd ~/Desktop/Work/Webcite && npm install
```

## Preview

```bash
npm run dev
```

Opens a server on http://localhost:8765 that rebuilds on every save, **drafts included**.
Errors are printed in the terminal; reload the browser to see changes.

## Publish

Commit and push to `main`. GitHub Actions ([`.github/workflows/pages.yml`](.github/workflows/pages.yml))
runs the tests, builds the site and deploys it. If a test or the build fails, nothing is
deployed and the live site stays as it was.

Only the files listed in `STATIC_FILES` in [`build/config.mjs`](build/config.mjs) are copied
to the site. **A new hand-written page or image must be added there**, or it won't be published.

## Writing a note

Copy [`notes/example-note.md`](notes/example-note.md): it shows every feature and is
itself a working example. Each note starts with front matter:

```yaml
---
title: The groupoid model in Lean
date: 2026-11-25
description: One line shown on the Notes page and in the feed.   # optional
updated: 2026-12-02                                               # optional
draft: true                                                       # optional; remove to publish
---
```

- **Sections** start at `##`. (`#` is an error: the title is the page heading.)
- **Math**: `$...$` inline, `$$ ... $$` on their own lines for display. Markdown never
  touches what is inside the dollars. Write `\$` for a literal dollar sign.
  Shared macros (`\ua`, `\U`, `\Set`, `\op`...) are in [`build/macros.mjs`](build/macros.mjs).
- **Theorems**:

  ```markdown
  :::theorem[Optional title]{#thm:some-id}
  Statement.
  :::
  ```

  Also `lemma`, `proposition`, `corollary`, `conjecture`, `definition`, `example`,
  `remark` (all numbered together) and `proof` (unnumbered).
- **References**: `[](#thm:some-id)` becomes "Theorem 3", and stays right when
  numbering changes. `[any text](#thm:some-id)` keeps your text.
- **Code**: fenced blocks with a language, e.g. ` ```lean `, are highlighted.
- GitHub-flavoured Markdown: tables, footnotes `[^1]`, strikethrough, task lists.

The build **fails with file and line** on: invalid LaTeX, unknown `:::block`, references
to missing ids, duplicate ids, `#` headings, and `$5 and $10`-style unescaped dollars.
Drafts never block publishing.

## Extending the Markdown

The pipeline is in [`build/markdown.mjs`](build/markdown.mjs) (unified: remark → rehype).
Our extensions are in [`build/extensions/`](build/extensions/), each a plugin that works on
the syntax tree:

| File | Does |
|---|---|
| `theorems.mjs` | `:::theorem` etc.: numbering, titles, ids |
| `crossrefs.mjs` | `[](#id)` references |
| `lint.mjs` | the checks above; puts back `word:word` text the directive parser grabbed |
| `messages.mjs` | how extensions report errors and warnings |

To add one: write the plugin, register it in `markdown.mjs` in the right place, and add
tests to [`build/test/`](build/test/). Run `npm test` before pushing; CI runs it too.

## Domain and hosting

- Hosting: GitHub Pages, built by GitHub Actions, served at spencerwoolfson.com (`CNAME`).
- DNS: Cloudflare (all records **DNS only**, not proxied, or GitHub can't issue the HTTPS certificate).
- Registration: moving from WordPress.com to Cloudflare (in progress, Nov 2026).
- The old WordPress.com plan is set not to renew (ends 2027-07-12).
