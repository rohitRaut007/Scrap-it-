// Clears every Metro / Expo / NativeWind cache that has bitten us on
// Windows + pnpm. Safe to run any time the dev server is stopped.
//
// Usage: pnpm --filter @scrap-it/mobile clean
//
// Caches cleared:
//   - apps/mobile/.expo                (Expo dev artifacts)
//   - apps/mobile/node_modules/.cache  (Babel/Metro transformer caches)
//   - <os tmp>/metro-*                 (Metro's bundle cache)
//   - <os tmp>/haste-map-*             (Metro's file-map cache)
//   - <os tmp>/react-native-packager-* (legacy packager cache)

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

function rm(target) {
  if (!existsSync(target)) return false;
  try {
    rmSync(target, { recursive: true, force: true, maxRetries: 3 });
    console.log(`  removed ${target}`);
    return true;
  } catch (error) {
    console.warn(`  skipped ${target} (${error.code ?? error.message})`);
    return false;
  }
}

function cleanProjectCaches() {
  console.log("Project caches:");
  const targets = [
    join(projectRoot, ".expo"),
    join(projectRoot, "node_modules", ".cache"),
  ];
  let removed = 0;
  for (const t of targets) {
    if (rm(t)) removed += 1;
  }
  if (removed === 0) console.log("  (nothing to clean)");
}

function cleanTmpCaches() {
  const tmp = tmpdir();
  console.log(`OS temp caches (${tmp}):`);
  const prefixes = [
    "metro-",
    "haste-map-",
    "react-native-packager-",
    "react-native-",
  ];
  let removed = 0;
  let entries;
  try {
    entries = readdirSync(tmp);
  } catch (error) {
    console.warn(`  could not read tmpdir: ${error.message}`);
    return;
  }

  for (const name of entries) {
    if (!prefixes.some((p) => name.startsWith(p))) continue;
    const full = join(tmp, name);
    try {
      if (statSync(full).isDirectory() && rm(full)) removed += 1;
    } catch {
      // entry vanished between readdir and stat; ignore.
    }
  }
  if (removed === 0) console.log("  (nothing to clean)");
}

cleanProjectCaches();
cleanTmpCaches();
console.log("\nDone. Now run: pnpm --filter @scrap-it/mobile dev -- -c");
