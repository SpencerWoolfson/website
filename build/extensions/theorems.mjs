// Theorem-style environments.
//
// Syntax (generic "directive" syntax, parsed by remark-directive):
//
//   :::theorem[Yoneda]{#thm:yoneda}
//   Statement, with *any* Markdown and $math$.
//   :::
//
//   :::proof
//   ...
//   :::
//
// - `[...]` is an optional title, shown in parentheses.
// - `{#id}` is an optional anchor id, used by cross-references (see crossrefs.mjs).
// - Numbered environments share one counter: Theorem 1, Lemma 2, Definition 3, ...
//
// To add an environment, add a line to ENVIRONMENTS (and, if it needs its own look,
// a `.env-<name>` rule in style.css).

import { visit } from "unist-util-visit";
import { error } from "./messages.mjs";

export const ENVIRONMENTS = {
  theorem: { label: "Theorem", numbered: true },
  lemma: { label: "Lemma", numbered: true },
  proposition: { label: "Proposition", numbered: true },
  corollary: { label: "Corollary", numbered: true },
  conjecture: { label: "Conjecture", numbered: true },
  definition: { label: "Definition", numbered: true },
  example: { label: "Example", numbered: true },
  remark: { label: "Remark", numbered: true },
  proof: { label: "Proof", numbered: false },
};

const ID_PATTERN = /^[A-Za-z][\w:.-]*$/;

/** remark plugin. Leaves a registry of labelled environments in `file.data.envs`. */
export default function remarkTheorems() {
  return (tree, file) => {
    /** @type {Map<string, {name: string, label: string, number: number | null, text: string}>} */
    const envs = new Map();
    let counter = 0;

    visit(tree, "containerDirective", (node) => {
      const env = ENVIRONMENTS[node.name];
      if (!env) {
        error(
          file,
          `Unknown block \`:::${node.name}\`. Known blocks: ${Object.keys(ENVIRONMENTS).join(", ")}.`,
          node,
          "unknown-block",
        );
        return;
      }

      // Optional title: remark-directive stores `[...]` as a first paragraph flagged directiveLabel.
      let titleChildren = null;
      const first = node.children[0];
      if (first?.type === "paragraph" && first.data?.directiveLabel) {
        titleChildren = first.children;
        node.children.shift();
      }

      const attrs = node.attributes ?? {};
      const extra = Object.keys(attrs).filter((k) => k !== "id");
      if (extra.length) {
        error(file, `\`:::${node.name}\` only takes an id ({#...}); got ${extra.join(", ")}.`, node, "bad-attribute");
      }
      const id = attrs.id;
      if (id !== undefined) {
        if (!ID_PATTERN.test(id)) {
          error(file, `Id "${id}" must start with a letter and use only letters, digits, and : . _ -`, node, "bad-id");
        } else if (envs.has(id)) {
          error(file, `Id "${id}" is used twice.`, node, "duplicate-id");
        }
      }

      const number = env.numbered ? ++counter : null;
      const text = number === null ? env.label : `${env.label} ${number}`;
      if (id) envs.set(id, { name: node.name, label: env.label, number, text });

      // Heading run-in: "**Theorem 3** (Title)." or "*Proof.*"
      const head = env.numbered
        ? [
            { type: "strong", children: [{ type: "text", value: text }] },
            ...(titleChildren ? [{ type: "text", value: " (" }, ...titleChildren, { type: "text", value: ")" }] : []),
            { type: "text", value: ". " },
          ]
        : [
            {
              type: "emphasis",
              children: [
                { type: "text", value: env.label },
                ...(titleChildren ? [{ type: "text", value: " (" }, ...titleChildren, { type: "text", value: ")" }] : []),
                { type: "text", value: "." },
              ],
            },
            { type: "text", value: " " },
          ];
      const headSpan = { type: "emphasis", data: { hName: "span", hProperties: { className: ["env-head"] } }, children: head };

      if (node.children[0]?.type === "paragraph") {
        node.children[0].children.unshift(headSpan);
      } else {
        node.children.unshift({ type: "paragraph", children: [headSpan] });
      }

      node.data = {
        ...node.data,
        hName: "section",
        hProperties: { className: ["env", `env-${node.name}`], ...(id ? { id } : {}) },
      };
    });

    file.data.envs = envs;
  };
}
