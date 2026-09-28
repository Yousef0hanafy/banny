/**
 * Copy the satori-compatible (WOFF) IBM Plex Sans Arabic files from
 * @fontsource into public/fonts — the OG share-card renderer reads them from
 * there at runtime (public/ is copied into the standalone build by the build
 * script, and node_modules is NOT traced for the opengraph route).
 *
 * Run once after adding/upgrading the fontsource package; the copied files
 * are committed to git.
 */
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules/@fontsource/ibm-plex-sans-arabic/files");
const dest = path.join(process.cwd(), "public/fonts");
mkdirSync(dest, { recursive: true });

const files = [
  "ibm-plex-sans-arabic-arabic-400-normal.woff",
  "ibm-plex-sans-arabic-arabic-700-normal.woff",
  "ibm-plex-sans-arabic-latin-400-normal.woff",
  "ibm-plex-sans-arabic-latin-700-normal.woff",
];

for (const f of files) {
  cpSync(path.join(src, f), path.join(dest, f));
  console.log("copied", f);
}
console.log("OG fonts synced →", dest);
