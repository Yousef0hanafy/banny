#!/usr/bin/env bash
# Release D browser QA matrix — "For You" rail + reading streaks/badges (FD-12).
# ONE self-contained session: standalone server (local QA Postgres 18 on :54329)
# + agent-browser. Sandbox reaps detached processes between tool calls.
set -u
cd /home/z/my-project
OUT=research
mkdir -p "$OUT"

export DATABASE_URL="postgres://qa@127.0.0.1:54329/bunny_qa"
export DIRECT_URL="$DATABASE_URL"

pkill -f "standalone/server.js" 2>/dev/null; sleep 1
NODE_ENV=production bun .next/standalone/server.js > /tmp/d-server.log 2>&1 &
sleep 6

ab() { agent-browser "$@"; }

echo "== 0. HEALTH =="
curl -s http://localhost:3000/api/health
echo ""

echo "== 1. GUEST home — cold start: NO For You rail =="
ab set viewport 1280 800 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
echo "foryou rail present (must be false): $(ab eval 'String([...document.querySelectorAll("section[aria-label]")].some(s=>s.getAttribute("aria-label")?.includes("لك")) )')"

echo "== 2. SIGN IN as reader@bunny.demo =="
ab open http://localhost:3000/login >/dev/null
ab wait "main" >/dev/null
ab fill 'input[type="email"]' "reader@bunny.demo" >/dev/null
ab fill 'input[type="password"]' "bunny-reader-2026" >/dev/null
ab click 'button[type="submit"]' >/dev/null
sleep 4
echo "url after login: $(ab get url)"

echo "== 3. SIGNED-IN home — For You rail + reasons =="
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 3
ab screenshot "$OUT/qa-d-home-foryou.png" >/dev/null
echo "foryou rail present: $(ab eval 'String([...document.querySelectorAll("section[aria-label]")].some(s=>s.getAttribute("aria-label")?.includes("لك")))')"
echo "foryou cards: $(ab eval 'String([...document.querySelectorAll("section[aria-label^=\"لك\"] a[aria-label]")].length)')"
echo "reason samples: $(ab eval 'JSON.stringify([...document.querySelectorAll("section[aria-label^=\"لك\"] p.text-primary\\/90")].slice(0,3).map(p=>p.textContent))')"
echo "home overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"

echo "== 4. PROFILE — streak section + chart + badges =="
ab open http://localhost:3000/profile >/dev/null
ab wait "main" >/dev/null
sleep 3
ab screenshot "$OUT/qa-d-profile-streak.png" >/dev/null
echo "streak section: $(ab eval 'String(!!document.querySelector("section[aria-label=\"سلسلة القراءة\"]"))')"
echo "streak value: $(ab eval 'document.querySelector("section[aria-label=\"سلسلة القراءة\"] .text-3xl")?.textContent?.trim()')"
echo "stat trio: $(ab eval 'JSON.stringify([...document.querySelectorAll("section[aria-label=\"سلسلة القراءة\"] dd")].map(d=>d.textContent))')"
echo "chart svg: $(ab eval 'String(!!document.querySelector("section[aria-label=\"سلسلة القراءة\"] svg.recharts-surface"))')"
echo "badges grid: $(ab eval 'String(!!document.querySelector("section[aria-label=\"شارات القراءة\"]"))')"
echo "badges earned/total: $(ab eval 'String([...document.querySelectorAll("section[aria-label=\"شارات القراءة\"] > div > div")].filter(b=>b.textContent.includes("مُكتسبة")).length) + "/" + String(document.querySelectorAll("section[aria-label=\"شارات القراءة\"] > div > div").length)')"
echo "profile overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"

echo "== 5. READ a webtoon chapter → progress + events write path =="
SLUG="wedding-of-the-red-moon"
ab open "http://localhost:3000/read/webtoon/$SLUG/1" >/dev/null
ab wait "main" >/dev/null 2>&1
sleep 3
ab eval 'window.scrollTo(0, 2500)' >/dev/null
sleep 3
echo "reader title: $(ab get title)"
ab screenshot "$OUT/qa-d-reader.png" >/dev/null

echo "== 6. MOBILE 360 — home + profile =="
ab set viewport 360 744 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-d-home-360.png" >/dev/null
echo "mobile home overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"
ab open http://localhost:3000/profile >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-d-profile-360.png" >/dev/null
echo "mobile profile overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK" : "OVERFLOW"')"

echo "== 7. CONSOLE ERRORS =="
ab console 2>/dev/null | rg -i "error" | rg -v "favicon" | head -5 || echo "(none)"

ab close --all >/dev/null 2>&1
echo "== QA session complete =="
