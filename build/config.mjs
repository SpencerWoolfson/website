// Site-wide settings for the notes compiler.

import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const SITE = {
  title: "Spencer Woolfson",
  author: "Spencer Woolfson",
  email: "swoolfson@chapman.edu",
  url: "https://spencerwoolfson.com",
  notesDescription:
    "Notes by Spencer Woolfson on logic, category theory, Homotopy Type Theory, and Lean.",
};

// The ONLY files copied from the repo root into the published site.
// Anything not listed here (notes to self, README, the private master record...)
// can never be published by accident. Add new pages and assets here.
export const STATIC_FILES = [
  "index.html",
  "research.html",
  "formalization.html",
  "teaching.html",
  "cv.html",
  "style.css",
  "photo.jpg",
  "CNAME",
];

// Main navigation, in order. `href` is root-relative.
export const NAV = [
  { label: "About", href: "/index.html" },
  { label: "Research", href: "/research.html" },
  { label: "Formalization", href: "/formalization.html" },
  { label: "Teaching", href: "/teaching.html" },
  { label: "Notes", href: "/notes.html", key: "notes" },
  { label: "CV", href: "/cv.html" },
];
