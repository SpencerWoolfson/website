// Helpers so every extension reports problems the same way.
// An "error" fails the build (and the test suite); a "warning" is printed only.

export const SOURCE = "notes";

export function error(file, reason, node, ruleId) {
  const message = file.message(reason, { place: node?.position, ruleId, source: SOURCE });
  message.fatal = true;
  return message;
}

export function warning(file, reason, node, ruleId) {
  const message = file.message(reason, { place: node?.position, ruleId, source: SOURCE });
  message.fatal = false;
  return message;
}
