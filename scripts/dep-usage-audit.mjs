#!/usr/bin/env node
/**
 * Dependency usage audit (Release C security audit helper).
 * Cross-references package.json deps against import/require/css-plugin usage
 * across src/, scripts/, prisma/, and globals.css. Prints deps with ZERO
 * references so a human can decide removal (some are tooling — see KEEP).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/home/z/my-project";
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// Tooling deps that are legitimately not imported anywhere:
const KEEP = new Set([
  "prisma",              // CLI
  "eslint", "eslint-config-next",
  "typescript", "bun-types",
  "tailwindcss", "@tailwindcss/postcss", "tailwindcss-animate", "tw-animate-css", // css plugins
  "class-variance-authority", "clsx", "tailwind-merge", // consumed via lib/utils cn()
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const sources = [
  ...walk(join(ROOT, "src")),
  ...walk(join(ROOT, "scripts")),
  ...walk(join(ROOT, "prisma")),
].filter((f) => /\.(ts|tsx|mjs|js|css)$/.test(f));

const haystack = sources.map((f) => readFileSync(f, "utf8")).join("\n");

const unused = [];
for (const dep of Object.keys(deps)) {
  if (KEEP.has(dep)) continue;
  const bare = dep.replace(/^@[^/]+\//, ""); // scope-stripped for @plugin references
  const patterns = [
    new RegExp(`from ["']${dep.replace(/[/@]/g, (m) => "\\" + m)}(["/']|)`, "m"),
    new RegExp(`require\\(["']${dep.replace(/[/@]/g, (m) => "\\" + m)}`),
    new RegExp(`import\\(["']${dep.replace(/[/@]/g, (m) => "\\" + m)}`),
    new RegExp(`@plugin\\s+["']${bare}`),
    new RegExp(`from ["']${bare}`), // e.g. sharp imported as plain name
  ];
  const used = patterns.some((re) => re.test(haystack));
  if (!used) unused.push(dep);
}

console.log("ZERO-REFERENCE dependencies:");
for (const d of unused.sort()) console.log("  -", d, deps[d]);
console.log(`\ntotal deps: ${Object.keys(deps).length}, zero-ref: ${unused.length}`);
