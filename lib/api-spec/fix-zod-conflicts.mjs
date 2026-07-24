/**
 * Post-codegen patch: Orval generates TypeScript query-param types with the
 * same name as the Zod path-param schemas (e.g. GetMonitoringDailyParams),
 * causing TS2308. Remove the TS type files that conflict with the Zod schemas
 * in generated/api.ts so `export *` from both barrels stays unambiguous.
 */

import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const typesDir = resolve(__dir, "..", "api-zod", "src", "generated", "types");
const typesIndex = resolve(typesDir, "index.ts");

// Names exported by api.ts (Zod schemas) that clash with types/ TS types.
// Orval follows the pattern {OperationId}Params for BOTH path-param Zod
// schemas and query-param TS types whenever an operation has BOTH.
// We keep the Zod schema and drop the TS type duplicates.
const CONFLICT_FILES = [
  "getMonitoringAnnualParams.ts",
  "getMonitoringDailyParams.ts",
  "getMonitoringMonthlyParams.ts",
];

// Delete the conflicting files
for (const f of CONFLICT_FILES) {
  const p = resolve(typesDir, f);
  if (existsSync(p)) {
    rmSync(p);
    console.log(`Removed conflicting type file: ${f}`);
  }
}

// Patch types/index.ts to remove the corresponding export lines
if (existsSync(typesIndex)) {
  const original = readFileSync(typesIndex, "utf8");
  const stems = CONFLICT_FILES.map((f) => f.replace(".ts", ""));
  const filtered = original
    .split("\n")
    .filter((line) => !stems.some((s) => line.includes(`'./${s}'`)))
    .join("\n");
  if (filtered !== original) {
    writeFileSync(typesIndex, filtered, "utf8");
    console.log("Patched types/index.ts to remove conflicting re-exports");
  }
}

console.log("fix-zod-conflicts: done");
