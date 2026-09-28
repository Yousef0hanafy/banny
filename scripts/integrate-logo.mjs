#!/usr/bin/env node
/**
 * integrate-logo.mjs — one-command brand integration for Bunny Library (مكتبة باني).
 *
 * Converts the founder's logo image (any raster: jpg/png/webp/...) into the full
 * brand + favicon set, replacing the temporary ب letter-mark placeholder.
 *
 * Usage:
 *   node scripts/integrate-logo.mjs <path-to-image> [--cover]
 *   node scripts/integrate-logo.mjs --test          # pipeline self-test, no app files touched
 *
 * What it does (real run):
 *   1. Validates + decodes the input (min side 256px, ≤25MB).
 *   2. Squares it: 'contain' letterboxed on the app background #0B0B10 (default)
 *      or 'cover' crop-fill with --cover.
 *   3. Writes:
 *        src/app/icon.png            512×512 (Next auto-registers favicon + shortcut)
 *        src/app/favicon.ico         16+32+48 PNG-in-ICO entries (legacy browsers)
 *        src/app/apple-icon.png      180×180 (iOS home screen)
 *        src/assets/brand/logo.png   512×512 (statically imported by BrandMark)
 *   4. Removes the placeholder src/app/icon.svg (real logo becomes authoritative).
 *   5. Rewrites src/components/library/brand-mark.tsx to render the real asset
 *      via next/image static import (same export signature — 4 consumers untouched).
 *
 * After running: `bun run build` then commit. Git history preserves the placeholder.
 *
 * Secrets/content discipline: never fabricate a logo; the placeholder stays until
 * a real file is delivered. --test outputs go to research/logo-test/ only.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = {
  icon: resolve(ROOT, "src/app/icon.png"),
  ico: resolve(ROOT, "src/app/favicon.ico"),
  apple: resolve(ROOT, "src/app/apple-icon.png"),
  brand: resolve(ROOT, "src/assets/brand/logo.png"),
  iconSvgPlaceholder: resolve(ROOT, "src/app/icon.svg"),
  brandMark: resolve(ROOT, "src/components/library/brand-mark.tsx"),
};

const APP_BG = { r: 11, g: 11, b: 16, alpha: 1 }; // #0B0B10 — app background
const ICO_SIZES = [16, 32, 48];

// ---------- ICO builder (PNG-compressed entries, Vista+) ----------
function buildIco(pngEntries) {
  const count = pngEntries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 1 + 1); // type: 1 = icon
  header.writeUInt16LE(count, 4);
  const dirSize = 6 + 16 * count;
  const entries = [];
  let offset = dirSize;
  for (const { size, png } of pngEntries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colors
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8); // data size
    e.writeUInt32LE(offset, 12); // data offset
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngEntries.map((p) => p.png)]);
}

// ---------- pipeline ----------
async function decodeInput(inputPath) {
  if (!existsSync(inputPath)) throw new Error(`Input not found: ${inputPath}`);
  const stat = statSync(inputPath);
  if (stat.size === 0) throw new Error("Input file is empty");
  if (stat.size > 25 * 1024 * 1024) throw new Error("Input exceeds 25MB");
  const img = sharp(inputPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot decode image (format: ${meta.format ?? "unknown"})`);
  if (Math.min(meta.width, meta.height) < 256) {
    throw new Error(`Image too small (${meta.width}×${meta.height}); min side is 256px for favicon quality`);
  }
  return meta;
}

async function squaredSource(inputPath, fit) {
  // Normalize once into a square 1024 canvas — all outputs derive from it.
  return sharp(inputPath)
    .resize(1024, 1024, { fit, background: APP_BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function emit(squared, dir, { cover }) {
  const src = sharp(squared);
  const png512 = await src.clone().resize(512, 512).png({ compressionLevel: 9 }).toBuffer();
  const png180 = await sharp(squared).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
  const icoEntries = await Promise.all(
    ICO_SIZES.map(async (size) => ({
      size,
      png: await sharp(squared).resize(size, size, { kernel: "lanczos3" }).png().toBuffer(),
    })),
  );
  const ico = buildIco(icoEntries);

  mkdirSync(dir, { recursive: true });
  const paths = {
    icon: resolve(dir, "icon.png"),
    ico: resolve(dir, "favicon.ico"),
    apple: resolve(dir, "apple-icon.png"),
    brand: resolve(dir, "logo.png"),
  };
  writeFileSync(paths.icon, png512);
  writeFileSync(paths.ico, ico);
  writeFileSync(paths.apple, png180);
  writeFileSync(paths.brand, png512);
  return { paths, png512: png512.length, png180: png180.length, ico: ico.length, cover: cover ? "cover" : "contain" };
}

function brandMarkTemplate({ sourceName, date, cover }) {
  return `import Image from "next/image";
import logoSrc from "@/assets/brand/logo.png";

/**
 * Brand mark — founder's rabbit logo (real asset).
 * Integrated by scripts/integrate-logo.mjs on ${date} from "${sourceName}"
 * (${cover} fit on the app background). Favicon set: src/app/icon.png +
 * src/app/favicon.ico + src/app/apple-icon.png.
 * Consumers (do not duplicate — this is the single brand swap point):
 * header chrome, login page, admin desktop sidebar, admin mobile nav.
 */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <Image
      src={logoSrc}
      alt=""
      aria-hidden
      focusable="false"
      className={\`\${className} rounded-[14px] ring-1 ring-white/10\`}
    />
  );
}
`;
}

// ---------- self-test ----------
async function runTest() {
  const testDir = resolve(ROOT, "research/logo-test");
  rmSync(testDir, { recursive: true, force: true });
  // Synthetic TEST pattern (explicitly NOT the brand — pipeline validation only).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
    <rect width="900" height="700" fill="#0B0B10"/>
    <circle cx="450" cy="350" r="200" fill="#9B7BFF"/>
    <circle cx="450" cy="120" r="40" fill="#DDBB77"/>
    <text x="450" y="660" font-size="48" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">TEST PATTERN</text>
  </svg>`;
  const testPng = resolve(testDir, "input-test.png");
  const { paths, ...sizes } = await emit(await sharp(Buffer.from(svg)).png().toBuffer(), testDir, { cover: false });
  writeFileSync(testPng, await sharp(Buffer.from(svg)).png().toBuffer());

  // Validate outputs read back correctly.
  const checks = [];
  for (const [label, path, wantSize] of [
    ["icon.png 512", paths.icon, 512],
    ["apple-icon.png 180", paths.apple, 180],
    ["logo.png 512", paths.brand, 512],
  ]) {
    const meta = await sharp(path).metadata();
    checks.push([label, meta.width === wantSize && meta.height === wantSize, `${meta.width}×${meta.height}`]);
  }
  const ico = readFileSync(paths.ico);
  const icoOk =
    ico[0] === 0 && ico[1] === 0 && ico[2] === 1 && ico[3] === 0 && ico.readUInt16LE(4) === ICO_SIZES.length;
  checks.push(["favicon.ico header", icoOk, `count=${ico.readUInt16LE(4)}, ${(ico.length / 1024).toFixed(1)}KB`]);
  // Each entry's embedded blob must be a valid PNG at its declared offset.
  let entriesOk = true;
  for (let i = 0; i < ICO_SIZES.length; i++) {
    const off = ico.readUInt32LE(6 + 16 * i + 12);
    entriesOk =
      entriesOk && ico[off + 1] === 0x50 && ico[off + 2] === 0x4e && ico[off + 3] === 0x47; // "PNG"
  }
  checks.push(["favicon.ico PNG entries", entriesOk, `${ICO_SIZES.join("/")}px`]);

  console.log("LOGO PIPELINE SELF-TEST (outputs in research/logo-test/, app untouched)");
  console.log(`  fit: ${sizes.cover} | icon ${(sizes.png512 / 1024).toFixed(1)}KB | apple ${(sizes.png180 / 1024).toFixed(1)}KB | ico ${(sizes.ico / 1024).toFixed(1)}KB`);
  let fail = 0;
  for (const [label, ok, detail] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}  (${detail})`);
    if (!ok) fail++;
  }
  console.log(fail === 0 ? "SELF-TEST: ALL PASS" : `SELF-TEST: ${fail} FAILURE(S)`);
  process.exit(fail === 0 ? 0 : 1);
}

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--test") return runTest();

  const rawPath = args.find((a) => !a.startsWith("--"));
  const cover = args.includes("--cover");
  if (!rawPath) {
    console.error("Usage: node scripts/integrate-logo.mjs <path-to-image> [--cover]\n       node scripts/integrate-logo.mjs --test");
    process.exit(2);
  }
  const inputPath = isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), rawPath);
  const sourceName = inputPath.split("/").pop();

  console.log(`Decoding ${sourceName} …`);
  const meta = await decodeInput(inputPath);
  console.log(`  ok: ${meta.format} ${meta.width}×${meta.height}`);
  const squared = await squaredSource(inputPath, cover ? "cover" : "contain");
  const { paths, ...sizes } = await emit(squared, ROOT, { cover });

  // Real outputs go to their canonical app locations (emit wrote into ROOT root;
  // move to exact paths).
  const rename = [
    [resolve(ROOT, "icon.png"), OUT.icon],
    [resolve(ROOT, "favicon.ico"), OUT.ico],
    [resolve(ROOT, "apple-icon.png"), OUT.apple],
    [resolve(ROOT, "logo.png"), OUT.brand],
  ];
  for (const [from, to] of rename) {
    mkdirSync(dirname(to), { recursive: true });
    if (from !== to) {
      rmSync(to, { force: true });
      writeFileSync(to, readFileSync(from));
      rmSync(from, { force: true });
    }
  }

  if (existsSync(OUT.iconSvgPlaceholder)) {
    rmSync(OUT.iconSvgPlaceholder);
    console.log("Removed placeholder src/app/icon.svg");
  }
  writeFileSync(OUT.brandMark, brandMarkTemplate({ sourceName, date: new Date().toISOString().slice(0, 10), cover: cover ? "cover" : "contain" }));

  console.log("Brand integration complete:");
  console.log(`  src/app/icon.png        (${(sizes.png512 / 1024).toFixed(1)}KB)`);
  console.log(`  src/app/favicon.ico     (${(sizes.ico / 1024).toFixed(1)}KB, ${ICO_SIZES.join("/")})`);
  console.log(`  src/app/apple-icon.png  (${(sizes.png180 / 1024).toFixed(1)}KB)`);
  console.log(`  src/assets/brand/logo.png`);
  console.log(`  src/components/library/brand-mark.tsx  → real logo (4 consumers auto-updated)`);
  console.log("Next: bun run build  → verify → commit.");
}

main().catch((err) => {
  console.error(`FAILED: ${err.message}`);
  process.exit(1);
});
