// HTML templates for generated pages. The header, nav and footer mirror the
// hand-written pages (index.html etc.) so generated pages look identical.

import { SITE, NAV } from "./config.mjs";

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap";

/**
 * A complete page in the site layout.
 * @param {object} o
 * @param {string} o.title        page title (plain text)
 * @param {string} o.description  meta description (plain text)
 * @param {string} o.body         inner HTML of <div class="wrap"> in <main>
 * @param {string} [o.nav]        key of the current nav item ("notes")
 * @param {"page"|"true"} [o.current]  aria-current value for that item
 * @param {boolean} [o.math]      include the KaTeX stylesheet
 * @param {boolean} [o.notemark]  include the notemark palette stylesheet
 * @param {string} [o.canonical]  absolute URL of this page
 */
export function page({ title, description, body, nav, current = "page", math = false, notemark = false, canonical }) {
  const navLinks = NAV.map((item) => {
    const cur = item.key && item.key === nav ? ` aria-current="${current}"` : "";
    return `        <a href="${item.href}"${cur}>${escapeHtml(item.label)}</a>`;
  }).join("\n");

  const fullTitle = title === SITE.title ? title : `${title} · ${SITE.title}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
${canonical ? `  <link rel="canonical" href="${escapeHtml(canonical)}">\n` : ""}  <link rel="alternate" type="application/atom+xml" title="${escapeHtml(SITE.title)} · Notes" href="/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
${math ? `  <link rel="stylesheet" href="/assets/katex/katex.min.css">\n` : ""}  <link rel="stylesheet" href="/style.css">
${notemark ? `  <link rel="stylesheet" href="/assets/notemark.css">\n` : ""}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap">
      <a class="site-name" href="/index.html">${escapeHtml(SITE.title)}</a>
      <nav class="site-nav" aria-label="Main">
${navLinks}
      </nav>
    </div>
  </header>

  <main id="main" tabindex="-1">
    <div class="wrap">
${body}
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap">© ${new Date().getFullYear()} ${escapeHtml(SITE.author)} · <a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="/feed.xml">Notes feed</a></div>
  </footer>
</body>
</html>
`;
}

const DATE_LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const DATE_SHORT = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const isoDate = (d) => d.toISOString().slice(0, 10);

/** One note, rendered. */
export function notePage(note) {
  const updated = note.updated
    ? ` · updated <time datetime="${isoDate(note.updated)}">${DATE_LONG.format(note.updated)}</time>`
    : "";
  const draft = note.draft ? `<p class="draft-banner" role="note">Draft: not published.</p>\n` : "";
  const body = `${draft}<article class="post">
  <header class="post-header">
    <h1>${escapeHtml(note.title)}</h1>
    <p class="post-date muted"><time datetime="${isoDate(note.date)}">${DATE_LONG.format(note.date)}</time>${updated}</p>
  </header>
  <div class="post-body notemark">
${note.html}
  </div>
</article>
<p class="post-back"><a href="/notes.html">← All notes</a></p>`;
  return page({
    title: note.title,
    description: note.description || SITE.notesDescription,
    body,
    nav: "notes",
    current: "true",
    math: note.hasMath,
    notemark: true,
    canonical: `${SITE.url}/notes/${note.slug}/`,
  });
}

/** The Notes index (notes.html). */
export function notesIndexPage(notes) {
  const list = notes.length
    ? `<ul class="entries notes-list">
${notes
  .map(
    (n) => `  <li>
    <span class="when"><time datetime="${isoDate(n.date)}">${DATE_SHORT.format(n.date)}</time></span>
    <div>
      <div class="title"><a href="/notes/${n.slug}/">${escapeHtml(n.title)}</a>${n.draft ? ` <span class="draft-tag">draft</span>` : ""}</div>${
        n.description ? `\n      <p class="note">${escapeHtml(n.description)}</p>` : ""
      }
    </div>
  </li>`,
  )
  .join("\n")}
</ul>`
    : `<p>Nothing here yet.</p>`;

  const body = `<h1>Notes</h1>
<p class="muted" style="margin-top:0.75rem">Short write-ups on logic, category theory, Homotopy Type Theory, and Lean.</p>
${list}`;
  return page({
    title: "Notes",
    description: SITE.notesDescription,
    body,
    nav: "notes",
    canonical: `${SITE.url}/notes.html`,
  });
}

/** Atom feed of published notes. */
export function atomFeed(notes) {
  const updated = notes.length
    ? new Date(Math.max(...notes.map((n) => (n.updated ?? n.date).getTime())))
    : new Date(0);
  const entries = notes
    .map((n) => {
      const url = `${SITE.url}/notes/${n.slug}/`;
      return `  <entry>
    <title>${escapeHtml(n.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${n.date.toISOString()}</published>
    <updated>${(n.updated ?? n.date).toISOString()}</updated>${
      n.description ? `\n    <summary>${escapeHtml(n.description)}</summary>` : ""
    }
    <content type="html">${escapeHtml(n.html)}</content>
  </entry>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeHtml(SITE.title)} · Notes</title>
  <link href="${SITE.url}/notes.html"/>
  <link rel="self" href="${SITE.url}/feed.xml"/>
  <id>${SITE.url}/notes.html</id>
  <updated>${updated.toISOString()}</updated>
  <author><name>${escapeHtml(SITE.author)}</name></author>
${entries}
</feed>
`;
}
