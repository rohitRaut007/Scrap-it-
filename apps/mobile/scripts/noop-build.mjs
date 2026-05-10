import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(
  path.join(dist, ".turbo-build-marker"),
  `${new Date().toISOString()}\n[@scrap-it/mobile] Turbo build marker — native binaries use EAS.\n`,
);

console.log(
  "[@scrap-it/mobile] Wrote dist/.turbo-build-marker for Turborepo outputs.",
);
