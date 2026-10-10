import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public/series_images");
const destination = path.join(root, "public/art/supplied-covers");
await mkdir(destination, { recursive: true });
for (const file of (await readdir(source)).filter((file) => /\.png$/i.test(file))) {
  const name = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const output = path.join(destination, `${name}.webp`);
  await sharp(path.join(source, file))
    .rotate()
    .resize({ width: 900, height: 1350, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 6 })
    .toFile(output);
  console.log(`${name}: ${Math.round((await stat(output)).size / 1024)} KB`);
}
