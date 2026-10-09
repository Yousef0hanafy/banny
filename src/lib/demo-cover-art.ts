/** Resolve only the original demo paths, preserving every uploaded cover URL. */
const demoSlugs = new Set([
  "warden-of-the-twilight-gate",
  "wedding-of-the-red-moon",
  "city-pulse-zero",
  "mint-leaf-cafe",
  "zainab-wardrobe",
  "harbor-of-the-missing",
]);

export function displayCover(coverPath: string): string {
  const match = /^\/art\/covers\/([a-z0-9-]+)\.webp$/.exec(coverPath);
  return match && demoSlugs.has(match[1])
    ? `/art/demo-illustrated/${match[1]}-v2.png`
    : coverPath;
}
