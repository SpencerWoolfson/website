// Checks that catch common mistakes before they reach the page.

import { visit, SKIP } from "unist-util-visit";
import { bundledLanguages } from "shiki";
import { error, warning } from "./messages.mjs";

const PLAIN_LANGUAGES = new Set(["text", "txt", "plain", "math"]);

/**
 * - `# Heading` inside a note: the note title is already the page's only <h1>.
 * - Inline math that starts or ends with a space is almost always two dollar amounts
 *   ("costs $5 and $10") read as math. Write `\$5` for a literal dollar sign.
 * - Records whether the note has math, so the page only loads KaTeX's stylesheet when needed.
 */
export function remarkLint() {
  return (tree, file) => {
    let hasMath = false;
    visit(tree, (node) => {
      if (node.type === "heading" && node.depth === 1) {
        error(file, "Use `##` for sections: the note's title is the page heading.", node, "no-h1");
      }
      if (node.type === "inlineMath") {
        hasMath = true;
        if (/^\s|\s$/.test(node.value)) {
          error(
            file,
            `Inline math "$${node.value}$" starts or ends with a space. If these are dollar signs, escape them as \\$.`,
            node,
            "suspicious-dollar",
          );
        }
      }
      if (node.type === "math") hasMath = true;
      if (node.type === "code" && node.lang && !PLAIN_LANGUAGES.has(node.lang) && !(node.lang in bundledLanguages)) {
        warning(file, `Unknown code language "${node.lang}"; shown without highlighting.`, node, "unknown-language");
      }
    });
    file.data.hasMath = hasMath;
  };
}

/**
 * remark-directive also reads `:word` inside ordinary text as a "text directive", so
 * "see note:this" would silently lose ":this". Any directive that no extension handled
 * is put back exactly as it was written. (Unknown `:::blocks` are errors, see theorems.mjs.)
 */
export function remarkRestoreUnhandledDirectives() {
  return (tree, file) => {
    const source = String(file.value);
    visit(tree, (node, index, parent) => {
      if ((node.type === "textDirective" || node.type === "leafDirective") && !node.data?.hName && parent) {
        const raw = source.slice(node.position.start.offset, node.position.end.offset);
        const replacement =
          node.type === "leafDirective"
            ? { type: "paragraph", children: [{ type: "text", value: raw }] }
            : { type: "text", value: raw };
        parent.children.splice(index, 1, replacement);
        return [SKIP, index + 1];
      }
    });
  };
}
