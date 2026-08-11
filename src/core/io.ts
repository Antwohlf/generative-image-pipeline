import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const ensureDirectory = async (directory: string): Promise<void> => {
  await mkdir(directory, { recursive: true });
};

export const readJson = async <T>(filePath: string): Promise<T> =>
  JSON.parse(await readFile(filePath, "utf8")) as T;

export const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

export const sha256File = async (filePath: string): Promise<string> =>
  sha256(await readFile(filePath));

export const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const relativeDisplayPath = (root: string, target: string): string => {
  const relative = path.relative(root, target);
  return relative || ".";
};
