import type { Scalar } from "../types.js";

const tokenPattern = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

export const renderTemplate = (
  template: string,
  variables: Record<string, Scalar>,
): string => {
  const missing = new Set<string>();
  const rendered = template.replace(tokenPattern, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined) {
      missing.add(key);
      return "";
    }
    return String(value);
  });

  if (missing.size > 0) {
    throw new Error(`Missing template variable(s): ${[...missing].sort().join(", ")}`);
  }

  return rendered.replace(/\s+/g, " ").trim();
};

export const slugify = (value: Scalar): string =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "value";

export const assertSafeFileName = (fileName: string): void => {
  if (fileName !== fileName.trim() || fileName !== fileName.split(/[\\/]/).pop()) {
    throw new Error(`Unsafe generated filename: ${fileName}`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(fileName)) {
    throw new Error(`Generated filename contains unsupported characters: ${fileName}`);
  }
};
