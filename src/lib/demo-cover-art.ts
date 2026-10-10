/** Resolve only the original demo paths, preserving every uploaded cover URL. */
const demoSlugs = new Set([
  "warden-of-the-twilight-gate",
  "wedding-of-the-red-moon",
  "city-pulse-zero",
  "mint-leaf-cafe",
  "zainab-wardrobe",
  "harbor-of-the-missing",
]);

const suppliedCovers: Record<string, string> = {
  "letters-from-the-seventh-floor": "the-lantern-and-the-mirror-shadow-8",
  "sand-that-remembers-names": "guardian-beneath-the-star-serpent-10",
  "the-six-thirty-train": "neon-courier-in-the-rain-4",
  "harbor-of-old-stars": "spectral-whale-above-the-coral-sea-6",
  "the-city-that-forgot-rain": "shadow-swordsman-beneath-the-eclipse-1",
  "the-last-tide-season": "emerald-roses-under-moonlight-2",
};

export function displayCover(coverPath: string): string {
  const match = /^\/art\/covers\/([a-z0-9-]+)\.webp$/.exec(coverPath);
  if (match && suppliedCovers[match[1]]) {
    return `/art/supplied-covers/${suppliedCovers[match[1]]}.webp`;
  }
  return match && demoSlugs.has(match[1])
    ? `/art/demo-illustrated/${match[1]}-v2.png`
    : coverPath;
}
