// The Markdown → HTML pipeline for notes.
//
//   Markdown text
//     → remark-parse              CommonMark
//     → remark-gfm                tables, footnotes, strikethrough, task lists, autolinks
//     → remark-math               $inline$ and $$display$$ math, parsed so Markdown never touches it
//     → remark-directive          generic :::block / ::leaf / :text syntax
//     → OUR EXTENSIONS            (build/extensions/) give that syntax meaning, check the note
//     → remark-rehype             Markdown tree → HTML tree
//     → rehype-katex              math rendered to HTML + MathML at build time
//     → @shikijs/rehype           code highlighting (incl. Lean 4), light and dark themes
//     → rehype-slug / autolink    ids and links on section headings
//     → rehype-stringify          HTML text
//
// To add an extension: write a remark plugin (Markdown tree) or rehype plugin (HTML tree)
// in build/extensions/, add it below in the right place, and add tests in build/test/.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { VFile } from "vfile";

import remarkTheorems from "./extensions/theorems.mjs";
import remarkCrossrefs from "./extensions/crossrefs.mjs";
import { remarkLint, remarkRestoreUnhandledDirectives } from "./extensions/lint.mjs";
import { MACROS } from "./macros.mjs";

// KaTeX "strict" checks: report real LaTeX problems as errors, but allow Unicode
// characters such as ≃ or → typed directly into math.
function katexStrict(errorCode) {
  return errorCode === "unicodeTextInMathMode" ? "ignore" : "error";
}

function createProcessor() {
  return (
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkDirective)
      // --- our extensions (order matters) ---
      .use(remarkTheorems)
      .use(remarkCrossrefs)
      .use(remarkRestoreUnhandledDirectives)
      .use(remarkLint)
      // --------------------------------------
      .use(remarkRehype, {
        footnoteLabel: "Notes",
        footnoteBackLabel: (i) => `Back to reference ${i + 1}`,
      })
      .use(rehypeKatex, {
        // A fresh copy per note, so \gdef in one note cannot leak into another.
        macros: structuredClone(MACROS),
        strict: katexStrict,
        trust: false,
      })
      .use(rehypeShiki, {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: "light",
        fallbackLanguage: "text",
      })
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: "wrap",
        properties: { className: ["heading-link"] },
        test: ["h2", "h3", "h4"],
      })
      .use(rehypeStringify)
  );
}

/**
 * Compile one note body (front matter already removed).
 * @param {string} markdown
 * @param {object} [o]
 * @param {string} [o.path]        file path, for messages
 * @param {number} [o.lineOffset]  lines of front matter above the body, so messages point at the right line
 * @returns {Promise<{html: string, hasMath: boolean, errors: string[], warnings: string[]}>}
 */
export async function compileMarkdown(markdown, { path = "note.md", lineOffset = 0 } = {}) {
  const file = new VFile({ path, value: markdown });
  await createProcessor().process(file);

  const where = (m) => {
    const line = m.line != null ? m.line + lineOffset : null;
    return `${path}${line != null ? `:${line}${m.column != null ? `:${m.column}` : ""}` : ""}`;
  };
  const errors = [];
  const warnings = [];
  const byPosition = [...file.messages].sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0));
  for (const m of byPosition) {
    // rehype-katex reports invalid LaTeX as a plain message; treat it as an error.
    const isError = m.fatal === true || m.source === "rehype-katex";
    const reason = m.source === "rehype-katex" && m.cause ? `Math error: ${m.cause.message ?? m.cause}` : m.reason;
    (isError ? errors : warnings).push(`${where(m)}  ${reason}${m.ruleId ? `  [${m.ruleId}]` : ""}`);
  }

  return { html: String(file.value), hasMath: Boolean(file.data.hasMath), errors, warnings };
}
