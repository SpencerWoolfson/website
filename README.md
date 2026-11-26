# spencerwoolfson.com — new site (draft)

Plain HTML + one stylesheet. No build step.

| File | Page |
|---|---|
| `index.html` | About (home) |
| `research.html` | Papers, talks, projects |
| `cv.html` | Education, teaching, skills |
| `style.css` | All styling, light and dark mode |

## Edit

Open the `.html` file, copy an existing `<li>` block in the right list, change the text. Content source of truth: `Spencer_Woolfson_Master.md`, kept in this folder but not in the repo (it has private notes; see `.gitignore`).

## Preview

```bash
cd ~/Desktop/Work/Webcite && python3 -m http.server 8765
```

Then open http://localhost:8765.

## Still to do before going live

- [x] Save the portrait as `photo.jpg` here and point `index.html` at it (resized to 600×800, location metadata stripped).
- [x] Put the folder on GitHub and turn on GitHub Pages (public repo `SpencerWoolfson/website`).
- [x] Point spencerwoolfson.com's DNS (managed at WordPress.com) at GitHub Pages (apex A/AAAA to GitHub, `www` CNAME to spencerwoolfson.github.io; `CNAME` file in repo).
- [ ] Only after the new site is live: stop the WordPress.com plan from renewing, keep the domain.
