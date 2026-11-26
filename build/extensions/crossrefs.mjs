// Cross-references to labelled environments.
//
//   By [](#thm:yoneda), every functor is ...      →  "By Theorem 3, every functor is ..."
//   See [the lemma](#lem:key).                    →  link text kept as written
//
// A link with EMPTY text to `#id` gets its text filled in ("Theorem 3"). Every link to
// `#id` must point at an id that exists in the note, otherwise the build fails.
// Runs after remark-theorems, which records the ids in `file.data.envs`.

import { visit } from "unist-util-visit";
import { error } from "./messages.mjs";

export default function remarkCrossrefs() {
  return (tree, file) => {
    const envs = file.data.envs ?? new Map();

    // Ids that headings will get are not known yet (rehype-slug assigns them later),
    // so only references to environments are checked and filled in here.
    visit(tree, "link", (node) => {
      if (!node.url.startsWith("#")) return;
      const id = decodeURIComponent(node.url.slice(1));
      const target = envs.get(id);
      const empty = node.children.length === 0;

      if (target) {
        if (empty) node.children = [{ type: "text", value: target.text }];
        node.data = { ...node.data, hProperties: { ...(node.data?.hProperties ?? {}), className: ["xref"] } };
      } else if (empty) {
        const known = [...envs.keys()];
        error(
          file,
          `Reference to unknown id "#${id}".${known.length ? ` Known ids: ${known.join(", ")}.` : " No environment in this note has an id."}`,
          node,
          "unknown-reference",
        );
      }
    });
  };
}
