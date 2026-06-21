import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "dist");

const entries = [
  "assets",
  "code",
  "images",
  "pdf",
  "vendor",
  "CNAME",
  "favicon.svg",
  "prism.css",
  "prism.js"
];

await mkdir(outDir, { recursive: true });

for (const entry of entries) {
  await cp(join(root, entry), join(outDir, entry), {
    recursive: true,
    force: true,
    errorOnExist: false
  });
}
