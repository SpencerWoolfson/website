# spencerwoolfson.com

Hand-written HTML pages, plus **Notes**: posts written in
[notemark](https://github.com/SpencerWoolfson/notemark), our Markdown for mathematical
writing, and built into pages by the code in [`build/`](build/).

| Path | What it is |
|---|---|
| `index.html`, `research.html`, `formalization.html`, `teaching.html`, `cv.html` | Hand-written pages. Edit the HTML directly. |
| `style.css` | All styling, light and dark mode. |
| `notes/*.md` | Notes. One file per note; the file name becomes the URL `/notes/<name>/`. |
| `build/` | Site build: compiles notes with notemark, templates, Notes index, feed, tests. |
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

Notes are written in **[notemark](https://github.com/SpencerWoolfson/notemark)** (private
repo, also at `~/Desktop/Work/notemark`), our Markdown for mathematical writing: math,
theorem environments, cross-references, Lean highlighting and strict checks. Its README is
the language reference.

Copy [`notes/example-note.md`](notes/example-note.md) to start: it uses every feature. Each
note starts with front matter, which this site handles (notemark only sees the body):

```yaml
---
title: The groupoid model in Lean
date: 2026-11-25
description: One line shown on the Notes page and in the feed.   # optional
updated: 2026-12-02                                               # optional
draft: true                                                       # optional; remove to publish
---
```

The build fails with file and line on any notemark error, on bad front matter, or on a
missing allowlisted file. Drafts never block publishing. Shared LaTeX macros for all notes
are in [`build/macros.mjs`](build/macros.mjs).

**Colours.** Inside notes, colours come from two terminal colour schemes,
[`build/palettes/site-light.json`](build/palettes/site-light.json) and
[`site-dark.json`](build/palettes/site-dark.json) (same format as Windows Terminal / iTerm
themes; slots and roles are in notemark's README). The build turns them into
`/assets/notemark.css` and **fails if any colour drops below WCAG AA contrast**, naming the
colour and what it is used for. The rest of the site uses the colours in `style.css`.

## How the site uses notemark

- `package.json` pins a tagged release: `"notemark": "github:SpencerWoolfson/notemark#v0.2.0"`.
  To upgrade, tag a release in notemark, change the tag here, run `npm install`, commit.
- To try unreleased notemark changes locally: `npm install ../notemark`, then put the
  pinned version back (`npm install github:SpencerWoolfson/notemark#vX.Y.Z`) before committing.
- GitHub Actions reads the private notemark repo with a read-only deploy key
  (secret `NOTEMARK_DEPLOY_KEY` here; key "website CI (read-only)" on notemark).
- Site-specific code stays here in [`build/`](build/): front matter and drafts
  (`build.mjs`), page templates, Notes index and feed (`templates.mjs`), the published-file
  allowlist (`config.mjs`), macros, and the dev server.

## Domain and hosting

- Hosting: GitHub Pages, built by GitHub Actions, served at spencerwoolfson.com (`CNAME`).
- DNS: Cloudflare (all records **DNS only**, not proxied, or GitHub can't issue the HTTPS certificate).
- Registration: moving from WordPress.com to Cloudflare (in progress, Nov 2026).
- The old WordPress.com plan is set not to renew (ends 2027-07-12).
