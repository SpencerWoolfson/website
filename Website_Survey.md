# Survey: academic and professional personal websites

Compiled 2026-11-25 to guide the redesign of spencerwoolfson.com.

**Method and limits.** I read each site's text (front page, and the papers page where there was one). The fetch tool returns text, not rendered pages, so fonts, colours and widths were **not** checked. Notes on look are limited to layout facts (photo or not, sidebar or single column). Three sites in my field could not be read: Jon Sterling (403), Steve Awodey (CMU page 404 / empty), Egbert Rijke (domain did not resolve).

---

## Academic sites (logic, category theory, Lean)

| Site | Structure | How papers/talks are shown | Tech | Worth borrowing |
|---|---|---|---|---|
| [Emily Riehl](https://emilyriehl.github.io/) | Nav: About, Books, Papers, Notes, Talks, Teaching, **Formalization**, Media, CV. Front: photo + contact card (Email, GitHub, Scholar, ORCID), short bio, news paragraphs | Grouped by type (Published research, Exposition, Popular writing, Preprints). Each entry: authors, title linked to own PDF, venue, year, arXiv link | Jekyll, AcademicPages theme | A dedicated **Formalization** page; popular writing kept separate from research |
| [Patrick Massot](https://www.imo.universite-paris-saclay.fr/~patrick.massot/en/) | Nav: Papers, Exposition, Teaching, Diffusion, Misc. Front: photo, contact block, research paragraph with links to Lean projects, "what's on this site" list, "updated on" date | Flat list by year. Each: title, journal, **short abstract**, then "arXiv version / published version" links | Hand-written HTML | A one-paragraph abstract under each paper; an "updated on" stamp |
| [Mike Shulman](https://home.sandiego.edu/~shulman/) | No menu. Front: photo, title, contact, short bullet sections (Math, Teaching, Links) | Grouped **by topic** (HOTT, HoTT, logic, category theory…). Each: title, co-authors, venue, DOI, arXiv, and **[PDF] slides for each talk** | Hand-written HTML | Talks and their slides listed next to the paper they belong to |
| [Kevin Buzzard](https://www.ma.imperial.ac.uk/~buzzard/) | No menu; one long page: Me, Xena and Lean, Research, Teaching, Other | Reverse-chronological; title, co-authors, arXiv, journal/DOI | Hand-written HTML | Hosting useful material (notes, errata, solutions) as PDFs |
| [Terence Tao](https://terrytao.wordpress.com/) | Blog feed is the front page; static pages for Career advice, On writing, Books | No paper list | WordPress.com | Only worth it if you will post regularly |

## Templates and professional sites

| Site | What it is | Worth borrowing |
|---|---|---|
| [al-folio](https://alshedivat.github.io/al-folio/) | Jekyll academic template (GitHub Pages). Front: bio, photo, dated **news** table, selected publications, social icons | Publications generated from **one BibTeX file**, each with PDF / DOI / code buttons |
| [Hugo Blox academic](https://academic-demo.netlify.app/) | Hugo academic template. Card layout, featured images, theme picker | A consistent **row of small link badges per paper**: Preprint · Code · Slides · Cite |
| [Practical Typography](https://practicaltypography.com/) | Butterick's online book on typography | A short "key rules" summary above the detail |
| [Andy Matuschak](https://andymatuschak.org/) | Researcher in tools for thought. Short bio, then numbered lists of projects and notes | A list of **open questions / current work** |
| [Gwern](https://gwern.net/) | Very large essay site | A **changelog** / "new" marker that shows the site is maintained |
| [Julia Evans](https://jvns.ca/) | Technical blog | Show a few **favourites** up front, the full list behind |
| [Paul Graham](https://paulgraham.com/) | Essays; almost no design | Proof that plain text with no theme is fine if the content is good |
| [Bret Victor](https://worrydream.com/) | Designer/researcher. Year-by-year index, each project with a one-line gloss | One-line gloss next to each item |

General guidance found: an [AMS mentoring post](https://blogs.ams.org/mathmentoringnetwork/2021/02/) lists what mathematicians usually include (contact, photo, research interests, upcoming talks). A [Berkeley Townsend Center article](https://townsendcenter.berkeley.edu/blog/personal-academic-webpages-how-tos-and-tips-better-site) found design was the weakest element of most academic sites. An [Emory math guide](https://math.emory.edu/~ehart5/documents/Website_Instructions.pdf) recommends picking a site you like and modelling yours on it.

---

## What this means for your site

What the sites in your field have in common: **links on every paper**, a clear contact block with ORCID/GitHub/Scholar, and plain layouts. Most of the best mathematician sites are hand-written HTML, which is what the draft is.

**Already in the draft:** photo, short bio, contact links (Email, ORCID, GitHub), research interests, papers/talks/projects, CV page, plain readable layout.

**Add, in order of value:**
1. **Links on every paper and talk.** arXiv · PDF · DOI · slides · code (Lean repo). This is the biggest gap; right now no entry links anywhere.
2. **A Formalization section** (Riehl). Your Lean/HoTT work deserves its own place: HoTT in Lean repo, the groupoid model, any Mathlib contributions.
3. **A one- or two-sentence abstract under each paper** (Massot).
4. **A short News list** on the home page (al-folio, Riehl): upcoming talks, new preprints. Plus a "Last updated" date in the footer.
5. **Google Scholar and arXiv author links**, once you have them.
6. **Teaching page** (Riehl, Massot, Buzzard): courses taught at Chapman, with public course pages if any.

**Skip:** a blog front page (Tao, Evans) unless you plan to post; heavy templates with images on every card (Hugo Blox); theme pickers.

**Tech:** stay with hand-written HTML for now. Move to al-folio (Jekyll) only if the paper list grows and you want it generated from a BibTeX file.
