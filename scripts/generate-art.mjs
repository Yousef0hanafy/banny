/**
 * Bunny Library — original abstract art generator (Release A).
 * Renders deterministic, non-infringing abstract cover art, manga storyboard pages,
 * and webtoon panels via sharp (SVG -> WebP). No text, no characters, no copyrighted material.
 * Run: node scripts/generate-art.mjs
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { SERIES, hashSeed, mulberry32 } from "./release-a-data.mjs";
import { SERIES_B } from "./release-b-data.mjs";

const PUBLIC = "public/art";
const COVERS = `${PUBLIC}/covers`;
const PAGES = `${PUBLIC}/pages`;
const PANELS = `${PUBLIC}/panels`;

const PAPER = "#EDE9E2";
const INK = "#17141F";

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function specks(rng, n, color, w, h, opacity = 0.5) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += `<circle cx="${(rng() * w).toFixed(0)}" cy="${(rng() * h).toFixed(0)}" r="${(0.8 + rng() * 2.2).toFixed(1)}" fill="${color}" opacity="${(opacity * (0.3 + rng() * 0.7)).toFixed(2)}"/>`;
  }
  return s;
}

/* ---------------- Covers (768x1152) ---------------- */

function coverSVG(series) {
  const rng = mulberry32(hashSeed(series.slug + ":cover"));
  const w = 768, h = 1152;
  const a = series.accent;
  const a2 = shade(a, 0.45);
  const a3 = shade(a, 1.35);
  let motif = "";

  if (series.motif === "gate") {
    motif = `
      <circle cx="560" cy="330" r="150" fill="${a3}" opacity="0.85"/>
      <circle cx="560" cy="330" r="210" fill="none" stroke="${a3}" stroke-width="3" opacity="0.4"/>
      <rect x="150" y="300" width="70" height="560" rx="8" fill="${INK}" opacity="0.92"/>
      <rect x="240" y="360" width="70" height="500" rx="8" fill="${INK}" opacity="0.75"/>
      <rect x="470" y="360" width="70" height="500" rx="8" fill="${INK}" opacity="0.75"/>
      <rect x="560" y="300" width="70" height="560" rx="8" fill="${INK}" opacity="0.92"/>
      <path d="M150 300 Q415 130 630 300" fill="none" stroke="${a}" stroke-width="10" opacity="0.9"/>
      ${specks(rng, 70, "#F4F0E8", w, h, 0.6)}`;
  } else if (series.motif === "cafe") {
    motif = `
      <rect x="120" y="620" width="380" height="240" rx="26" fill="${INK}" opacity="0.9"/>
      <rect x="160" y="660" width="300" height="90" rx="16" fill="${a3}" opacity="0.9"/>
      <path d="M300 640 C280 590 330 580 310 530 C295 490 340 480 325 440" stroke="#F4F0E8" stroke-width="7" fill="none" opacity="0.75" stroke-linecap="round"/>
      <circle cx="590" cy="280" r="90" fill="${a}" opacity="0.65"/>
      <rect x="90" y="880" width="600" height="16" rx="8" fill="${a}" opacity="0.5"/>
      ${specks(rng, 40, "#F4F0E8", w, h, 0.5)}`;
  } else if (series.motif === "harbor") {
    motif = `
      <rect x="0" y="700" width="${w}" height="452" fill="${INK}" opacity="0.55"/>
      <ellipse cx="380" cy="760" rx="330" ry="70" fill="${a3}" opacity="0.25"/>
      <ellipse cx="300" cy="820" rx="260" ry="60" fill="${a3}" opacity="0.18"/>
      <rect x="520" y="180" width="60" height="360" rx="6" fill="${INK}" opacity="0.9"/>
      <circle cx="550" cy="180" r="52" fill="${a}" opacity="0.95"/>
      <circle cx="550" cy="180" r="90" fill="none" stroke="${a}" stroke-width="4" opacity="0.45"/>
      <path d="M0 700 L768 700" stroke="${a3}" stroke-width="5" opacity="0.5"/>
      ${specks(rng, 55, "#F4F0E8", w, 700, 0.55)}`;
  } else if (series.motif === "redmoon") {
    motif = `
      <circle cx="384" cy="330" r="190" fill="${a}" opacity="0.9"/>
      <circle cx="384" cy="330" r="250" fill="none" stroke="${a}" stroke-width="3" opacity="0.5"/>
      <path d="M120 640 Q384 520 648 640 L648 1152 L120 1152 Z" fill="${INK}" opacity="0.85"/>
      <path d="M200 640 Q384 560 568 640 L568 1152 L200 1152 Z" fill="${shade(a, 0.3)}" opacity="0.55"/>
      ${Array.from({ length: 26 }, () => {
        const x = (rng() * w).toFixed(0), y = (600 + rng() * 420).toFixed(0);
        return `<circle cx="${x}" cy="${y}" r="${(3 + rng() * 5).toFixed(0)}" fill="${a3}" opacity="${(0.35 + rng() * 0.5).toFixed(2)}"/>`;
      }).join("")}`;
  } else if (series.motif === "city") {
    motif = `
      ${Array.from({ length: 12 }, (_, i) => {
        const bw = 40 + rng() * 70, bx = i * 64 + rng() * 10, bh = 180 + rng() * 420;
        return `<rect x="${bx.toFixed(0)}" y="${(1152 - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${INK}" opacity="${(0.55 + rng() * 0.4).toFixed(2)}"/>`;
      }).join("")}
      <rect x="0" y="1030" width="${w}" height="6" fill="${a3}" opacity="0.8"/>
      <circle cx="600" cy="260" r="110" fill="${a}" opacity="0.35"/>
      <circle cx="600" cy="260" r="60" fill="${a3}" opacity="0.8"/>
      <path d="M60 420 L340 420 M60 470 L260 470" stroke="${a}" stroke-width="8" opacity="0.5" stroke-linecap="round"/>
      ${specks(rng, 50, "#F4F0E8", w, 700, 0.5)}`;
  } else if (series.motif === "wardrobe") {
    motif = `
      <rect x="170" y="230" width="430" height="640" rx="18" fill="${INK}" opacity="0.92"/>
      <rect x="385" y="230" width="0" height="640" stroke="${a3}" stroke-width="4" opacity="0.5"/>
      <rect x="210" y="270" width="150" height="560" rx="10" fill="${a}" opacity="0.55"/>
      <rect x="410" y="270" width="150" height="560" rx="10" fill="${shade(a, 0.55)}" opacity="0.75"/>
      <circle cx="365" cy="560" r="14" fill="${a3}"/>
      <circle cx="405" cy="560" r="14" fill="${a3}"/>
      <path d="M120 900 Q384 830 648 900 L648 1152 L120 1152 Z" fill="${a}" opacity="0.25"/>
      ${specks(rng, 45, "#F4F0E8", w, h, 0.45)}`;
  } else if (series.motif === "letters") {
    // Release B — flying envelopes over rooftops (text-free abstraction)
    motif = `
      ${Array.from({ length: 7 }, (_, i) => {
        const ex = 140 + rng() * 440, ey = 200 + i * 90 + rng() * 40, es = 46 + rng() * 34, rot = -14 + rng() * 28;
        return `<g transform="rotate(${rot.toFixed(0)} ${ex.toFixed(0)} ${ey.toFixed(0)})">
          <rect x="${(ex - es / 2).toFixed(0)}" y="${(ey - es / 2.6).toFixed(0)}" width="${es.toFixed(0)}" height="${(es * 0.76).toFixed(0)}" rx="4" fill="#F4F0E8" opacity="${(0.55 + rng() * 0.4).toFixed(2)}"/>
          <path d="M${(ex - es / 2).toFixed(0)} ${(ey - es / 2.6).toFixed(0)} L${ex.toFixed(0)} ${(ey + es * 0.1).toFixed(0)} L${(ex + es / 2).toFixed(0)} ${(ey - es / 2.6).toFixed(0)}" fill="none" stroke="${INK}" stroke-width="2.5" opacity="0.7"/>
        </g>`;
      }).join("")}
      <rect x="120" y="880" width="530" height="180" rx="14" fill="${INK}" opacity="0.9"/>
      <rect x="150" y="910" width="470" height="14" rx="7" fill="${a}" opacity="0.8"/>
      <rect x="150" y="940" width="360" height="10" rx="5" fill="${a3}" opacity="0.6"/>
      ${specks(rng, 40, "#F4F0E8", w, h, 0.45)}`;
  } else if (series.motif === "dunes") {
    motif = `
      <path d="M0 700 Q200 600 420 690 T768 650 L768 1152 L0 1152 Z" fill="${INK}" opacity="0.85"/>
      <path d="M0 820 Q240 730 480 810 T768 780 L768 1152 L0 1152 Z" fill="${shade(a, 0.5)}" opacity="0.6"/>
      <circle cx="560" cy="250" r="130" fill="${a}" opacity="0.8"/>
      <circle cx="560" cy="250" r="190" fill="none" stroke="${a3}" stroke-width="3" opacity="0.4"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${60 + i * 12} ${880 + i * 14} L${700 - i * 10} ${880 + i * 14}" stroke="${a3}" stroke-width="3" opacity="0.35"/>`).join("")}
      ${specks(rng, 55, "#F4F0E8", w, 640, 0.5)}`;
  } else if (series.motif === "train") {
    motif = `
      <rect x="90" y="520" width="600" height="240" rx="30" fill="${INK}" opacity="0.92"/>
      <rect x="130" y="560" width="120" height="80" rx="8" fill="${a3}" opacity="0.9"/>
      <rect x="290" y="560" width="120" height="80" rx="8" fill="${a}" opacity="0.7"/>
      <rect x="450" y="560" width="120" height="80" rx="8" fill="${a3}" opacity="0.55"/>
      <circle cx="210" cy="800" r="34" fill="${INK}" stroke="${a3}" stroke-width="5"/>
      <circle cx="570" cy="800" r="34" fill="${INK}" stroke="${a3}" stroke-width="5"/>
      <path d="M40 860 Q400 830 730 860" stroke="${a}" stroke-width="7" fill="none" opacity="0.6"/>
      ${specks(rng, 50, "#F4F0E8", w, 480, 0.5)}`;
  } else if (series.motif === "waves") {
    motif = `
      <circle cx="384" cy="300" r="110" fill="${a3}" opacity="0.85"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${620 + i * 90} Q192 ${580 + i * 90} 384 ${620 + i * 90} T768 ${620 + i * 90}" fill="none" stroke="${i % 2 ? a : a3}" stroke-width="9" opacity="${(0.75 - i * 0.12).toFixed(2)}"/>`).join("")}
      ${Array.from({ length: 20 }, () => `<circle cx="${(rng() * w).toFixed(0)}" cy="${(560 + rng() * 120).toFixed(0)}" r="${(2 + rng() * 4).toFixed(0)}" fill="#F4F0E8" opacity="0.7"/>`).join("")}`;
  } else if (series.motif === "citadel") {
    motif = `
      <rect x="250" y="380" width="270" height="520" fill="${INK}" opacity="0.92"/>
      <path d="M250 380 L385 260 L520 380 Z" fill="${INK}" opacity="0.92"/>
      <rect x="340" y="640" width="90" height="260" rx="45" fill="${a}" opacity="0.75"/>
      <rect x="200" y="470" width="50" height="430" fill="${shade(a, 0.5)}" opacity="0.85"/>
      <rect x="520" y="440" width="50" height="460" fill="${shade(a, 0.5)}" opacity="0.85"/>
      ${Array.from({ length: 30 }, () => `<circle cx="${(rng() * w).toFixed(0)}" cy="${(rng() * 350).toFixed(0)}" r="${(1.5 + rng() * 3).toFixed(0)}" fill="#F4F0E8" opacity="0.65"/>`).join("")}`;
  } else if (series.motif === "tide") {
    motif = `
      <path d="M0 560 Q192 500 384 560 T768 560 L768 1152 L0 1152 Z" fill="${a}" opacity="0.5"/>
      <path d="M0 700 Q192 640 384 700 T768 700 L768 1152 L0 1152 Z" fill="${INK}" opacity="0.8"/>
      <rect x="320" y="180" width="130" height="130" rx="14" fill="#F4F0E8" opacity="0.9"/>
      <rect x="340" y="205" width="90" height="10" rx="5" fill="${INK}" opacity="0.7"/>
      <rect x="340" y="225" width="70" height="8" rx="4" fill="${INK}" opacity="0.5"/>
      ${Array.from({ length: 14 }, () => `<circle cx="${(rng() * w).toFixed(0)}" cy="${(760 + rng() * 330).toFixed(0)}" r="${(2 + rng() * 5).toFixed(0)}" fill="${a3}" opacity="${(0.35 + rng() * 0.5).toFixed(2)}"/>`).join("")}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${shade(a, 0.28)}"/>
        <stop offset="0.55" stop-color="${shade(a, 0.12)}"/>
        <stop offset="1" stop-color="#0B0B10"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.7" cy="0.25" r="0.8">
        <stop offset="0" stop-color="${a}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="${a}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
    ${motif}
    <rect width="${w}" height="${h}" fill="none" stroke="rgba(244,240,232,0.12)" stroke-width="10"/>
  </svg>`;
}

/* ---------------- Manga page (800x1200) — abstract storyboard ---------------- */

function mangaPageSVG(series, chapter, pageIdx, total) {
  const rng = mulberry32(hashSeed(`${series.slug}:c${chapter}:p${pageIdx}`));
  const w = 800, h = 1200;
  const a = series.accent;
  const a3 = shade(a, 1.3);
  const layouts = [
    // 2x2 grid
    [[20, 20, 760, 540], [20, 580, 370, 600], [410, 580, 370, 290], [410, 890, 370, 290]],
    // big top + 2 rows
    [[20, 20, 760, 660], [20, 700, 760, 240], [20, 960, 760, 220]],
    // 3 columns
    [[20, 20, 240, 1160], [280, 20, 240, 1160], [540, 20, 240, 1160]],
    // cinematic top + split
    [[20, 20, 760, 480], [20, 520, 490, 660], [530, 520, 250, 660]],
  ];
  const panels = layouts[Math.floor(rng() * layouts.length)];
  const mood = rng();

  const panelContent = (x, y, pw, ph) => {
    const kind = Math.floor(rng() * 5);
    if (kind === 0) {
      // moon/orb scene
      const cx = x + pw * (0.3 + rng() * 0.4), cy = y + ph * (0.3 + rng() * 0.3), r = Math.min(pw, ph) * (0.18 + rng() * 0.15);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${a}" opacity="0.85"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 1.6}" fill="none" stroke="${a}" stroke-width="3" opacity="0.4"/>
        ${specks(rng, 12, "#2A2537", x + pw, y + ph, 0.6)}`;
    }
    if (kind === 1) {
      // speed lines (action)
      let s = "";
      for (let i = 0; i < 14; i++) {
        const yy = y + ph * rng();
        s += `<path d="M${x} ${yy.toFixed(0)} L${x + pw} ${(yy + (rng() - 0.5) * 40).toFixed(0)}" stroke="${INK}" stroke-width="${(1 + rng() * 2.5).toFixed(1)}" opacity="${(0.15 + rng() * 0.5).toFixed(2)}"/>`;
      }
      s += `<circle cx="${x + pw / 2}" cy="${y + ph / 2}" r="${Math.min(pw, ph) * 0.22}" fill="${a}" opacity="0.75"/>`;
      return s;
    }
    if (kind === 2) {
      // architecture / arch
      return `<path d="M${x + pw * 0.25} ${y + ph} L${x + pw * 0.25} ${y + ph * 0.4} Q${x + pw / 2} ${y} ${x + pw * 0.75} ${y + ph * 0.4} L${x + pw * 0.75} ${y + ph}" fill="none" stroke="${INK}" stroke-width="8" opacity="0.7"/>
        <rect x="${x + pw * 0.44}" y="${y + ph * 0.55}" width="${pw * 0.12}" height="${ph * 0.45}" fill="${a}" opacity="0.65"/>`;
    }
    if (kind === 3) {
      // quiet: horizon + silhouette
      const hy = y + ph * (0.55 + rng() * 0.2);
      return `<rect x="${x}" y="${hy}" width="${pw}" height="${y + ph - hy}" fill="${a}" opacity="0.3"/>
        <ellipse cx="${x + pw * 0.5}" cy="${hy}" rx="${pw * 0.28}" ry="${ph * 0.08}" fill="${INK}" opacity="0.8"/>
        <circle cx="${x + pw * (0.2 + rng() * 0.6)}" cy="${y + ph * 0.25}" r="${Math.min(pw, ph) * 0.1}" fill="${a3}" opacity="0.9"/>`;
    }
    // close-up: abstract ring + strokes
    return `<circle cx="${x + pw / 2}" cy="${y + ph / 2}" r="${Math.min(pw, ph) * 0.3}" fill="none" stroke="${INK}" stroke-width="10" opacity="0.75"/>
      <circle cx="${x + pw / 2}" cy="${y + ph / 2}" r="${Math.min(pw, ph) * 0.14}" fill="${a}" opacity="0.8"/>
      <path d="M${x + pw * 0.15} ${y + ph * 0.85} Q${x + pw / 2} ${y + ph * 0.6} ${x + pw * 0.85} ${y + ph * 0.85}" stroke="${INK}" stroke-width="4" fill="none" opacity="0.5"/>`;
  };

  let body = "";
  for (const [x, y, pw, ph] of panels) {
    body += `
      <rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="${mood > 0.75 ? shade(a, 0.16) : "#F7F4EE"}" stroke="${INK}" stroke-width="5"/>
      <g clip-path="url(#c${x}-${y})">${panelContent(x, y, pw, ph)}</g>
      <clipPath id="c${x}-${y}"><rect x="${x}" y="${y}" width="${pw}" height="${ph}"/></clipPath>`;
  }
  // page number dot (abstract marker, no text)
  body += `<circle cx="${w - 40}" cy="${h - 30}" r="8" fill="${a}" opacity="0.7"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${PAPER}"/>${body}
  </svg>`;
}

/* ---------------- Webtoon panel (800x1100) — abstract scene ---------------- */

function webtoonPanelSVG(series, chapter, panelIdx, total) {
  const rng = mulberry32(hashSeed(`${series.slug}:c${chapter}:w${panelIdx}`));
  const w = 800, h = 1100;
  const a = series.accent;
  const a3 = shade(a, 1.35);
  const aDark = shade(a, 0.2);
  const t = panelIdx / Math.max(total - 1, 1); // 0..1 narrative arc: intro -> climax -> resolve
  let scene = "";

  if (series.motif === "redmoon") {
    const moonR = 120 + t * 80;
    scene = `
      <circle cx="400" cy="${(300 - t * 60).toFixed(0)}" r="${moonR.toFixed(0)}" fill="${a}" opacity="${(0.75 + t * 0.2).toFixed(2)}"/>
      <circle cx="400" cy="${(300 - t * 60).toFixed(0)}" r="${(moonR * 1.5).toFixed(0)}" fill="none" stroke="${a3}" stroke-width="3" opacity="0.4"/>
      <path d="M0 780 Q200 ${720 + t * 60} 400 780 T800 780 L800 1100 L0 1100 Z" fill="${INK}" opacity="0.9"/>
      <path d="M0 860 Q200 ${810 + t * 40} 400 860 T800 860 L800 1100 L0 1100 Z" fill="${aDark}" opacity="0.8"/>
      ${Array.from({ length: 18 }, () => `<circle cx="${(rng() * w).toFixed(0)}" cy="${(680 + rng() * 380).toFixed(0)}" r="${(2 + rng() * 4).toFixed(0)}" fill="${a3}" opacity="${(0.3 + rng() * 0.5).toFixed(2)}"/>`).join("")}
      ${specks(rng, 40, "#F4F0E8", w, 640, 0.5)}`;
  } else if (series.motif === "city") {
    scene = `
      ${Array.from({ length: 9 }, (_, i) => {
        const bw = 50 + rng() * 80, bx = i * 92 - 20, bh = (140 + rng() * 320) * (0.5 + t);
        return `<rect x="${bx.toFixed(0)}" y="${(1100 - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${INK}" opacity="${(0.6 + rng() * 0.35).toFixed(2)}"/>`;
      }).join("")}
      <rect x="${(60 + t * 500).toFixed(0)}" y="180" width="90" height="200" rx="10" fill="${a3}" opacity="0.9"/>
      <rect x="${(60 + t * 500).toFixed(0)}" y="380" width="90" height="12" fill="${a3}" opacity="0.5"/>
      <path d="M0 620 L800 620" stroke="${a}" stroke-width="6" opacity="${(0.4 + t * 0.4).toFixed(2)}"/>
      ${specks(rng, 60, "#F4F0E8", w, 600, 0.55)}`;
  } else if (series.motif === "wardrobe") {
    scene = `
      <rect x="140" y="${(140 + t * 60).toFixed(0)}" width="520" height="620" rx="20" fill="${INK}" opacity="0.9"/>
      <rect x="180" y="${(180 + t * 60).toFixed(0)}" width="200" height="540" rx="12" fill="${a}" opacity="${(0.4 + t * 0.3).toFixed(2)}"/>
      <rect x="420" y="${(180 + t * 60).toFixed(0)}" width="200" height="540" rx="12" fill="${aDark}" opacity="0.85"/>
      <path d="M280 ${560 + t * 40} Q400 ${460 + t * 40} 520 ${560 + t * 40}" stroke="${a3}" stroke-width="8" fill="none" opacity="0.7"/>
      ${Array.from({ length: 10 }, () => `<circle cx="${(200 + rng() * 400).toFixed(0)}" cy="${(220 + rng() * 500).toFixed(0)}" r="${(3 + rng() * 6).toFixed(0)}" fill="${a3}" opacity="${(0.25 + rng() * 0.45).toFixed(2)}"/>`).join("")}`;
  } else if (series.motif === "tide") {
    scene = `
      <path d="M0 ${(620 + t * 60).toFixed(0)} Q200 ${(560 + t * 60).toFixed(0)} 400 ${(620 + t * 60).toFixed(0)} T800 ${(620 + t * 60).toFixed(0)} L800 1100 L0 1100 Z" fill="${aDark}" opacity="0.85"/>
      <path d="M0 ${(780 + t * 40).toFixed(0)} Q200 ${(730 + t * 40).toFixed(0)} 400 ${(780 + t * 40).toFixed(0)} T800 ${(780 + t * 40).toFixed(0)} L800 1100 L0 1100 Z" fill="${INK}" opacity="0.9"/>
      <circle cx="${(180 + t * 440).toFixed(0)}" cy="280" r="105" fill="${a3}" opacity="0.85"/>
      <rect x="${(140 + t * 80).toFixed(0)}" y="${(430 - t * 80).toFixed(0)}" width="160" height="110" rx="10" fill="#F4F0E8" opacity="0.9" transform="rotate(${(-6 + t * 12).toFixed(0)} ${(220 + t * 80).toFixed(0)} 485)"/>
      ${Array.from({ length: 16 }, () => `<circle cx="${(rng() * w).toFixed(0)}" cy="${(640 + rng() * 420).toFixed(0)}" r="${(2 + rng() * 4).toFixed(0)}" fill="${a3}" opacity="${(0.3 + rng() * 0.5).toFixed(2)}"/>`).join("")}
      ${specks(rng, 45, "#F4F0E8", w, 560, 0.5)}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${shade(a, 0.3)}"/>
        <stop offset="1" stop-color="${shade(a, 0.08)}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#wbg)"/>
    ${scene}
  </svg>`;
}

/* ---------------- Runner ---------------- */

async function render(svg, out, width) {
  const img = sharp(Buffer.from(svg), { density: 96 });
  if (width) img.resize({ width });
  await img.webp({ quality: 84 }).toFile(out);
}

async function main() {
  await mkdir(COVERS, { recursive: true });
  await mkdir(PAGES, { recursive: true });
  await mkdir(PANELS, { recursive: true });

  let count = 0;
  for (const s of [...SERIES, ...SERIES_B]) {
    await render(coverSVG(s), `${COVERS}/${s.slug}.webp`);
    count++;
    if (s.format === "novel") continue; // novels carry prose, no pages/panels
    for (const ch of s.chapters) {
      // Generate art for ALL chapters (incl. draft/review) so admin publishing works instantly.
      if (s.format === "manga") {
        const dir = `${PAGES}/${s.slug}/c${ch.number}`;
        await mkdir(dir, { recursive: true });
        for (let i = 0; i < ch.pages; i++) {
          await render(mangaPageSVG(s, ch.number, i, ch.pages), `${dir}/p${String(i + 1).padStart(2, "0")}.webp`);
          count++;
        }
      } else {
        const dir = `${PANELS}/${s.slug}/c${ch.number}`;
        await mkdir(dir, { recursive: true });
        for (let i = 0; i < ch.panels; i++) {
          await render(webtoonPanelSVG(s, ch.number, i, ch.panels), `${dir}/p${String(i + 1).padStart(2, "0")}.webp`);
          count++;
        }
      }
    }
  }
  console.log(`Generated ${count} art files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
