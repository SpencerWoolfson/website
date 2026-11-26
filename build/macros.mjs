// LaTeX macros available in every note. The build passes these to notemark's compile().
// Write the macro name with its backslash; the value is the expansion, with #1, #2... for arguments.
//
//   "\\Set": "\\mathbf{Set}",
//   "\\hom": "\\operatorname{Hom}_{#1}(#2, #3)",
//
// (In this file a LaTeX backslash is written twice, because it is inside a JavaScript string.)

export const MACROS = {
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\R": "\\mathbb{R}",
  "\\C": "\\mathbb{C}",
  "\\U": "\\mathcal{U}",
  "\\Set": "\\mathbf{Set}",
  "\\Cat": "\\mathbf{Cat}",
  "\\Grpd": "\\mathbf{Grpd}",
  "\\op": "^{\\mathrm{op}}",
  "\\id": "\\mathrm{id}",
  "\\ua": "\\mathsf{ua}",
};
