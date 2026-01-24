import { readFile } from "node:fs/promises";
import path from "node:path";

const basePath = path.join(process.cwd(), "ai", "prompts");

export const loadPrompt = async (fileName: string) => {
  return readFile(path.join(basePath, fileName), "utf8");
};
