// Tests for the Markdown pipeline and our extensions.  Run: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { compileMarkdown } from "../markdown.mjs";

/** The TeX source KaTeX embedded for each formula, in order (from the MathML annotation). */
function texOf(html) {
  return [...html.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].map((m) =>
    m[1]
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&"),
  );
}

async function ok(markdown) {
  const r = await compileMarkdown(markdown);
  assert.deepEqual(r.errors, [], `unexpected errors:\n${r.errors.join("\n")}`);
  return r;
}

async function fails(markdown, ruleOrText) {
  const r = await compileMarkdown(markdown);
  assert.ok(
    r.errors.some((e) => e.includes(ruleOrText)),
    `expected an error mentioning "${ruleOrText}", got:\n${r.errors.join("\n") || "(no errors)"}`,
  );
  return r;
}

// --- math: Markdown must never change what is inside $...$ -------------------------------

test("asterisks and underscores inside math are not emphasis", async () => {
  const { html } = await ok("Let $a*b*c$ and $x_1 + y_1$ and $a_b c_d$.");
  assert.deepEqual(texOf(html), ["a*b*c", "x_1 + y_1", "a_b c_d"]);
  assert.ok(!html.includes("<em>"));
});

test("backslash escapes inside math are kept", async () => {
  const { html } = await ok("$\\{x \\mid x > 0\\}$ and $a \\\\ b$ and $\\#\\%\\&$");
  assert.deepEqual(texOf(html), ["\\{x \\mid x > 0\\}", "a \\\\ b", "\\#\\%\\&"]);
});

test("display math keeps line breaks and environments", async () => {
  const { html } = await ok("$$\n\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\n$$");
  assert.ok(html.includes('class="katex-display"'));
  assert.match(texOf(html)[0], /\\begin\{pmatrix\} a & b \\\\ c & d \\end\{pmatrix\}/);
});

test("math in a table cell keeps its | characters", async () => {
  const { html } = await ok("| a | b |\n|---|---|\n| $\\{x \\mid y\\}$ | 2 |");
  assert.ok(html.includes("<table>"));
  assert.deepEqual(texOf(html), ["\\{x \\mid y\\}"]);
});

test("commutative diagrams with CD render", async () => {
  const { html } = await ok("$$\n\\begin{CD} A @>f>> B \\\\ @VgVV @VVhV \\\\ C @>>k> D \\end{CD}\n$$");
  assert.equal(texOf(html).length, 1);
});

test("math output includes MathML for screen readers", async () => {
  const { html } = await ok("$x$");
  assert.ok(html.includes("<math"));
});

test("shared macros expand", async () => {
  const { html } = await ok("$\\ua$ and $\\Set\\op$");
  assert.ok(html.includes("ua"), "ua rendered");
  assert.ok(!html.includes("katex-error"));
});

test("\\gdef in one note does not leak into the next", async () => {
  await ok("$\\gdef\\foo{x}\\foo$");
  await fails("$\\foo$", "Math error");
});

test("dollar signs in code are left alone", async () => {
  const { html, hasMath } = await ok("Use `$x$` or\n\n```\nprice = $5\n```");
  assert.equal(texOf(html).length, 0);
  assert.equal(hasMath, false);
});

test("escaped dollars are literal", async () => {
  const { html, hasMath } = await ok("It costs \\$5 or \\$10.");
  assert.ok(html.includes("$5") && html.includes("$10"));
  assert.equal(hasMath, false);
});

test("unescaped dollar amounts are caught", async () => {
  await fails("It costs $5 and $10.", "suspicious-dollar");
});

test("invalid LaTeX fails with the line number", async () => {
  const r = await fails("ok\n\nbad $\\frac{1$ here", "Math error");
  assert.ok(r.errors[0].startsWith("note.md:3:"), r.errors[0]);
});

test("unknown LaTeX commands fail", async () => {
  await fails("$\\notacommand x$", "Math error");
});

// --- theorems and references -----------------------------------------------------------

test("theorem environments are numbered with one shared counter", async () => {
  const { html } = await ok(
    ":::definition\nA.\n:::\n\n:::theorem[Main]{#thm:main}\nB.\n:::\n\n:::proof\nC.\n:::\n\n:::lemma\nD.\n:::",
  );
  assert.match(html, /<section class="env env-definition"><p><span class="env-head"><strong>Definition 1<\/strong>\. <\/span>A\.<\/p><\/section>/);
  assert.match(html, /<section class="env env-theorem" id="thm:main"><p><span class="env-head"><strong>Theorem 2<\/strong> \(Main\)\. <\/span>B\./);
  assert.match(html, /<section class="env env-proof"><p><span class="env-head"><em>Proof\.<\/em> <\/span>C\./);
  assert.match(html, /<strong>Lemma 3<\/strong>/);
});

test("environment titles can contain math", async () => {
  const { html } = await ok(":::theorem[The case $n = 0$]\nX.\n:::");
  assert.deepEqual(texOf(html), ["n = 0"]);
});

test("environment starting with display math still gets its heading", async () => {
  const { html } = await ok(":::lemma\n$$\nx = y\n$$\n:::");
  assert.match(html, /<strong>Lemma 1<\/strong>/);
});

test("empty references are filled in, also before the target", async () => {
  const { html } = await ok("See [](#lem:a).\n\n:::lemma{#lem:a}\nX.\n:::\n\nAnd [the lemma](#lem:a).");
  assert.ok(html.includes('<a href="#lem:a" class="xref">Lemma 1</a>'));
  assert.ok(html.includes('<a href="#lem:a" class="xref">the lemma</a>'));
});

test("reference to an unknown id fails", async () => {
  await fails("See [](#thm:nope).", "unknown-reference");
});

test("duplicate ids fail", async () => {
  await fails(":::theorem{#a}\nX.\n:::\n\n:::lemma{#a}\nY.\n:::", "duplicate-id");
});

test("unknown block names fail", async () => {
  await fails(":::theorm\nX.\n:::", "unknown-block");
});

test("words with colons stay as written", async () => {
  const { html } = await ok("See note:this, a::b, ratio 3:4 and :smile: here.");
  assert.ok(html.includes("note:this") && html.includes("a::b") && html.includes("3:4") && html.includes(":smile:"), html);
});

// --- other checks ------------------------------------------------------------------------

test("a # heading in a note fails (the title is the page heading)", async () => {
  await fails("# Title", "no-h1");
});

test("section headings get ids and self-links", async () => {
  const { html } = await ok("## The groupoid model");
  assert.ok(html.includes('<h2 id="the-groupoid-model"><a class="heading-link" href="#the-groupoid-model">'));
});

test("Lean code is highlighted in light and dark themes", async () => {
  const { html } = await ok("```lean\ntheorem t : True := trivial\n```");
  assert.ok(html.includes('class="shiki'));
  assert.ok(html.includes("--shiki-dark"));
});

test("unknown code languages warn but do not fail", async () => {
  const r = await ok("```notalanguage\nx\n```");
  assert.ok(r.warnings.some((w) => w.includes("unknown-language")));
});

test("raw HTML in a note is not passed through", async () => {
  const { html } = await ok('Hi <script>alert(1)</script> <img src=x onerror="alert(1)">');
  assert.ok(!html.includes("<script>") && !html.includes("onerror"));
});

test("GFM: footnotes, tables, strikethrough", async () => {
  const { html } = await ok("A[^1] ~~b~~\n\n| x |\n|---|\n| 1 |\n\n[^1]: Note.");
  assert.ok(html.includes('data-footnotes') && html.includes("<del>") && html.includes("<table>"));
});
