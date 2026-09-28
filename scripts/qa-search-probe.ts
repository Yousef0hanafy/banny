/**
 * Direct unit probe of the Arabic smart-search scoring (Release E QA).
 * Run: bun scripts/qa-search-probe.ts
 */
import { normalizeArabic, tokenizeArabic, scoreDocument, suggestTitle, withinEditDistance } from "../src/lib/arabic-search.ts";

const titles = [
  "حارس بوابة الشفق",
  "الختم الذي لا ينام",
  "ما لا يعبر عند الغروب",
  "ضوء بارد على السلالم",
  "حارس بلا ذكرى",
  "الطاحن تحت البوابة",
  "مقهى أوراق النعناع",
  "يوم المطر الأول",
  "الزبون الذي أعاد كتابة اللوحة",
  "نعناع مضاعف، سكر مفرد",
  "آخر فنجان قبل الإقفال",
  "ملف حالة: مرسى الغائبين",
  "الحقيبة رقم ١٧",
  "الفانوس الأزرق",
  "زفاف القمر الأحمر",
];

console.log("norm(الحقيبة ررقم) =", JSON.stringify(normalizeArabic("الحقيبة ررقم")));
console.log("tokens =", JSON.stringify(tokenizeArabic("الحقيبة ررقم")));
console.log("dist(رقم, رقم) =", withinEditDistance("رقم", "رقم", 1));

for (const q of ["الاحمر", "الحقيبة ررقم", "زحفاف", "مقهى اوراق", "النعناع"]) {
  const tokens = tokenizeArabic(q);
  const scored = titles
    .map((t) => ({
      t,
      score: scoreDocument(tokens, [
        { text: t, weight: 3 },
        { text: "زفاف القمر الأحمر ويبتون رومانسي فانتازيا", weight: 1 },
      ]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  console.log(`q="${q}" →`, scored.slice(0, 3).map((s) => `${s.t}:${s.score}`));
  console.log(`   suggest =`, suggestTitle(q, titles));
}
