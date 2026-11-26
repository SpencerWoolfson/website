---
title: Example note (template)
date: 2026-11-25
description: One line that appears under the title on the Notes page.
draft: true
---

This note is a **template** and a test page. Because it has `draft: true`, it
only appears in the local preview (`npm run dev`), never on the live site. To
start a new note, copy this file to `notes/short-name.md` (that becomes
`/notes/short-name/`), change the front matter, and delete `draft: true` when
it is ready to publish.

## Writing

Ordinary Markdown: *italics*, **bold**, [links](https://lean-lang.org),
`inline code`, lists, footnotes,[^1] and

> block quotes.

| Model | Interprets |
|---|---|
| Groupoids | HoTT$_0$ |
| Simplicial sets | HoTT |

[^1]: Footnotes are numbered automatically and listed at the end.

## Math

Inline math uses single dollars: a type $A$ is a *set* if any two paths
$p, q : x =_A y$ are equal. Markdown never touches what is inside the dollars,
so $a * b * c$, $x_1 + y_1$ and $\{x \mid x > 0\}$ are safe. For a literal
dollar sign, write `\$`, as in \$5.

Displayed math goes on its own lines between double dollars:

$$
\ua : (A \simeq B) \to (A =_{\U} B)
\qquad
\begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$

Shared macros such as `\ua`, `\U`, `\Set` and `\op` are defined in
`build/macros.mjs`. Commutative squares can use `CD`:

$$
\begin{CD}
A @>f>> B \\
@VgVV @VVhV \\
C @>>k> D
\end{CD}
$$

## Theorems and references

:::definition[Set]{#def:set}
A type $A$ is a **set** if for all $x, y : A$ and $p, q : x = y$ we have $p = q$.
:::

:::theorem[Hedberg]{#thm:hedberg}
Every type with decidable equality is a set in the sense of [](#def:set).
:::

:::proof
Omitted in this template.
:::

[](#thm:hedberg) is referred to by writing `[](#thm:hedberg)`; the text
"Theorem 2" is filled in and stays correct when theorems are added or moved.

## Lean

```lean
theorem add_comm' (a b : Nat) : a + b = b + a := by
  omega
```
