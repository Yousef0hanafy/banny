#!/usr/bin/env bash
# Release E browser QA matrix — notifications center + chapter comments/likes
# + Arabic smart search + share cards + creator studio (FD-13).
# ONE self-contained session: standalone server (local QA Postgres 18 on :54329)
# + agent-browser. Sandbox reaps detached processes between tool calls.
set -u
cd /home/z/my-project
OUT=research
mkdir -p "$OUT"

export DATABASE_URL="postgres://qa@127.0.0.1:54329/bunny_qa"
export DIRECT_URL="$DATABASE_URL"

pkill -f "standalone/server.js" 2>/dev/null; sleep 1
NODE_ENV=production bun .next/standalone/server.js > /tmp/e-server.log 2>&1 &
sleep 6

ab() { agent-browser "$@"; }

echo "== 0. HEALTH =="
curl -s http://localhost:3000/api/health
echo ""

echo "== 1. GUEST home — bell must be ABSENT =="
ab set viewport 1280 800 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "bell present (must be false): $(ab eval 'String(!!document.querySelector("button[aria-label^=\"الإشعارات\"]"))')"

echo "== 2. ARABIC SMART SEARCH (guest) =="
# 2a. hamza-less query: «الاحمر» without hamza on أ must match «زفاف القمر الأحمر»
ab open "http://localhost:3000/explore?q=%D8%A7%D9%84%D8%A7%D8%AD%D9%85%D8%B1" >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "hamza-less 'الاحمر' first hit: $(ab eval 'document.querySelector("main a[href^=\"/series/\"]")?.getAttribute("aria-label")?.slice(0,40) ?? document.querySelector("main a[href^=\"/series/\"]")?.textContent?.trim()?.slice(0,40)')"
# 2b. teh-marbuta + hamza swap: «مقهى اوراق» (ة→ه) must match «مقهى أوراق النعناع»
ab open "http://localhost:3000/explore?q=%D9%85%D9%82%D9%87%D9%89%20%D8%A7%D9%88%D8%B1%D8%A7%D9%82" >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "teh-marbuta 'مقهى اوراق' first hit: $(ab eval 'document.querySelector("main a[href^=\"/series/\"]")?.getAttribute("aria-label")?.slice(0,40) ?? document.querySelector("main a[href^=\"/series/\"]")?.textContent?.trim()?.slice(0,40)')"
# 2c. ya/alef-maqsura + teh-marbuta: «القديمه» must match «مرسى النجوم القديمة»
ab open "http://localhost:3000/explore?q=%D8%A7%D9%84%D9%82%D8%AF%D9%8A%D9%85%D9%87" >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "alef-maqsura 'القديمه' first hit: $(ab eval 'document.querySelector("main a[href^=\"/series/\"]")?.getAttribute("aria-label")?.slice(0,40) ?? document.querySelector("main a[href^=\"/series/\"]")?.textContent?.trim()?.slice(0,40)')"
# 2d. one-letter typo (within search tolerance): «السابعب» → «رسائل من الطابق السابع»
ab open "http://localhost:3000/explore?q=%D8%A7%D9%84%D8%B3%D8%A7%D8%A8%D8%B9%D8%A8" >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "typo 'السابعب' first hit: $(ab eval 'document.querySelector("main a[href^=\"/series/\"]")?.getAttribute("aria-label")?.slice(0,40) ?? document.querySelector("main a[href^=\"/series/\"]")?.textContent?.trim()?.slice(0,40)')"
# 2e. severe typo (substitution + extras, beyond search tolerance) → empty + «هل تقصد» chip
ab open "http://localhost:3000/explore?q=%D8%A7%D9%84%D8%B3%D8%A7%D8%A8%D8%A8%D8%A8%D8%A8" >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "severe typo results (must be 0): $(ab eval 'document.querySelectorAll("main a[href^=\"/series/\"]").length')"
echo "did-you-mean chip: $(ab eval 'String(document.body.textContent.includes("هل تقصد"))')"
ab screenshot "$OUT/qa-e-search.png" >/dev/null

echo "== 3. OG SHARE CARD (guest, curl) =="
curl -s -o "$OUT/qa-e-og-card.png" -w "http=%{http_code} type=%{content_type} bytes=%{size_download}\n" "http://localhost:3000/series/wedding-of-the-red-moon/opengraph-image"

echo "== 4. SIGN IN as reader@bunny.demo =="
ab open http://localhost:3000/login >/dev/null
ab wait "main" >/dev/null
ab fill 'input[type="email"]' "reader@bunny.demo" >/dev/null
ab fill 'input[type="password"]' "bunny-reader-2026" >/dev/null
ab click 'button[type="submit"]' >/dev/null
sleep 4
echo "url after login: $(ab get url)"

echo "== 5. BELL — unread badge + dropdown + mark-as-read =="
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 3
echo "bell present: $(ab eval 'String(!!document.querySelector("button[aria-label^=\"الإشعارات\"]"))')"
echo "bell aria-label: $(ab eval 'document.querySelector("button[aria-label^=\"الإشعارات\"]")?.getAttribute("aria-label")')"
ab click 'button[aria-label^="الإشعارات"]' >/dev/null
sleep 2
echo "dropdown items: $(ab eval 'document.querySelectorAll("[role=\"menuitem\"]").length')"
ab screenshot "$OUT/qa-e-bell-dropdown.png" >/dev/null
ab click '[role="menuitem"]' >/dev/null
sleep 3
echo "navigated after click: $(ab get url)"

echo "== 6. /notifications PAGE — list + mark all =="
ab open http://localhost:3000/notifications >/dev/null
ab wait "main" >/dev/null
sleep 2.5
echo "rows: $(ab eval 'document.querySelectorAll("main ul li").length')"
echo "unread dots: $(ab eval 'document.querySelectorAll("main ul li span[aria-label=\"غير مقروء\"]").length')"
ab screenshot "$OUT/qa-e-notifications.png" >/dev/null
ab eval 'const b=[...document.querySelectorAll("main button")].find(x=>x.textContent.includes("تعليم الكل")); if(b) b.click();' >/dev/null
sleep 2.5
echo "unread dots after mark-all: $(ab eval 'document.querySelectorAll("main ul li span[aria-label=\"غير مقروء\"]").length')"

echo "== 7. CHAPTER COMMENTS — webtoon inline + post + like =="
SLUG="wedding-of-the-red-moon"
ab open "http://localhost:3000/read/webtoon/$SLUG/1" >/dev/null
ab wait "main" >/dev/null 2>&1
sleep 3
ab eval 'window.scrollTo(0, document.body.scrollHeight)' >/dev/null
sleep 2.5
echo "inline comments section: $(ab eval 'String(!!document.querySelector("section[aria-label=\"التعليقات\"]"))')"
echo "chapter comments count label: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] h2")?.textContent?.trim()')"
ab fill 'textarea' "تعليق تجربة من قراءة الإصدار E — اللوحات أنيق عندها إيقاع بصري ممتاز." >/dev/null
ab eval 'const b=[...document.querySelectorAll("section[aria-label=\"التعليقات\"] button")].find(x=>x.textContent.includes("نشر")); if(b) b.click();' >/dev/null
sleep 3
echo "posted comment visible: $(ab eval 'String(document.body.textContent.includes("الإيقاع البصري") || document.body.textContent.includes("الإصدار E"))')"
# like the first comment heart
echo "heart before: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]")?.getAttribute("aria-pressed")')"
ab eval 'const h=document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]"); if(h) h.click();' >/dev/null
sleep 2.5
echo "heart after: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]")?.getAttribute("aria-pressed")')"
ab screenshot "$OUT/qa-e-webtoon-comments.png" >/dev/null

echo "== 8. SERIES PAGE — comment likes + share menu (warden has series-level comments) =="
WSLUG="warden-of-the-twilight-gate"
ab open "http://localhost:3000/series/$WSLUG" >/dev/null
ab wait "main" >/dev/null
sleep 3
echo "series comment cards: $(ab eval 'document.querySelectorAll("section[aria-label=\"التعليقات\"] ul > li").length')"
echo "series hearts: $(ab eval 'document.querySelectorAll("section[aria-label=\"التعليقات\"] button[aria-pressed]").length')"
echo "heart count label before: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]")?.textContent?.trim() || "0"')"
ab eval 'const h=document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]"); if(h) h.click();' >/dev/null
sleep 2.5
echo "heart pressed after: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]")?.getAttribute("aria-pressed")')"
echo "heart count label after: $(ab eval 'document.querySelector("section[aria-label=\"التعليقات\"] button[aria-pressed]")?.textContent?.trim() || "0"')"
ab click 'button[aria-label^="مشاركة"]' >/dev/null
sleep 2
echo "share menu items: $(ab eval 'JSON.stringify([...document.querySelectorAll("[role=\"menuitem\"]")].map(m=>m.textContent.trim()))')"
ab screenshot "$OUT/qa-e-share-menu.png" >/dev/null
ab press Escape >/dev/null 2>&1 || true; sleep 1

echo "== 8b. READER /studio deny (role=reader) =="
ab open http://localhost:3000/studio >/dev/null
ab wait "main" >/dev/null 2>&1
sleep 2
echo "reader studio url (expect denied redirect): $(ab get url)"

echo "== 9. STUDIO — admin sees insights, reader denied =="
ab open http://localhost:3000/notifications >/dev/null; sleep 1
# switch to admin
ab open http://localhost:3000/login >/dev/null
sleep 1
ab open http://localhost:3000/login >/dev/null
ab wait "main" >/dev/null
ab fill 'input[type="email"]' "admin@bunny.demo" >/dev/null
ab fill 'input[type="password"]' "bunny-admin-2026" >/dev/null
ab click 'button[type="submit"]' >/dev/null
sleep 4
ab open http://localhost:3000/studio >/dev/null
ab wait "main" >/dev/null
sleep 3
echo "studio header: $(ab eval 'String(document.body.textContent.includes("استوديو المبدعين"))')"
echo "studio series rows: $(ab eval 'document.querySelectorAll("main section ul li").length')"
echo "stat cards: $(ab eval '[...document.querySelectorAll("main .grid > div p")].slice(0,4).map(p=>p.textContent).join(" | ")')"
ab screenshot "$OUT/qa-e-studio.png" >/dev/null
echo "studio overflow 1280: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"

echo "== 10. MOBILE 360 — home + notifications =="
ab set viewport 360 744 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "mobile home overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"
ab open http://localhost:3000/notifications >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "mobile notifications overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"
ab screenshot "$OUT/qa-e-notifications-360.png" >/dev/null

echo "== 11. CONSOLE ERRORS =="
ab console 2>/dev/null | rg -i "error" | rg -v "favicon" | head -5 || echo "(none)"

ab close --all >/dev/null 2>&1
echo "== QA session complete =="
