#!/usr/bin/env bash
# Release C browser QA matrix — runs standalone server + agent-browser in ONE
# self-contained session (sandbox reaps detached processes between tool calls).
set -u
cd /home/z/my-project
OUT=research
mkdir -p "$OUT"

pkill -f "standalone/server.js" 2>/dev/null; sleep 1
env -u DATABASE_URL -u DIRECT_URL NODE_ENV=production bun .next/standalone/server.js > /tmp/c-server.log 2>&1 &
sleep 6

ab() { agent-browser "$@"; }

echo "== 1. DESKTOP 1280x800: home =="
ab set viewport 1280 800 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-c-home-1280.png" >/dev/null
echo "home landmarks: $(ab eval 'JSON.stringify({main:!!document.querySelector("main"),nav:document.querySelectorAll("nav").length,header:!!document.querySelector("header"),footer:!!document.querySelector("footer"),h1:document.querySelector("h1")?.textContent?.slice(0,40)})')"
echo "home overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK no horizontal overflow" : "OVERFLOW " + document.documentElement.scrollWidth + ">" + window.innerWidth')"

echo "== 2. Series page: hydration timestamp upgrade check =="
SLUG=$(ab eval 'document.querySelector("a[href^=\"/series/\"]")?.getAttribute("href")' | tr -d '"')
echo "first series href: $SLUG"
ab open "http://localhost:3000$SLUG" >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-c-series-1280.png" >/dev/null
echo "time elements: count=$(ab eval 'document.querySelectorAll("time").length') sample='$(ab eval 'document.querySelector("time")?.textContent')' dateTimeAttr=$(ab eval 'document.querySelector("time")?.getAttribute("datetime")')"
echo "comments section aria: $(ab eval 'JSON.stringify(document.querySelector("section[aria-label]")?.getAttribute("aria-label"))')"

echo "== 3. MOBILE 360x744: home + overflow + bottom nav =="
ab set viewport 360 744 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-c-home-360.png" >/dev/null
echo "mobile overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK no horizontal overflow" : "OVERFLOW " + document.documentElement.scrollWidth')"
echo "mobile nav: $(ab eval 'JSON.stringify({bottomNav: !!document.querySelector("nav.fixed"), items: [...document.querySelectorAll("nav.fixed a")].length})')"

echo "== 4. TABLET 768x1024: home =="
ab set viewport 768 1024 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
sleep 2
ab screenshot "$OUT/qa-c-home-768.png" >/dev/null
echo "tablet overflow: $(ab eval 'document.documentElement.scrollWidth <= window.innerWidth+1 ? "OK no horizontal overflow" : "OVERFLOW"')"

echo "== 5. WEBTOON reader (mobile viewport) =="
ab set viewport 360 744 >/dev/null
READURL=$(ab eval 'document.querySelector("a[href^=\"/read/webtoon/\"]")?.getAttribute("href")' | tr -d '"')
echo "reader href: $READURL"
if [ -n "$READURL" ]; then
  ab open "http://localhost:3000$READURL" >/dev/null
  ab wait "main" >/dev/null 2>&1
  sleep 2
  ab screenshot "$OUT/qa-c-webtoon-360.png" >/dev/null
  echo "reader page ok: $(ab get title)"
fi

echo "== 6. A11y: keyboard focus ring + skip behavior (desktop) =="
ab set viewport 1280 800 >/dev/null
ab open http://localhost:3000/ >/dev/null
ab wait "main" >/dev/null
ab press Tab >/dev/null; ab press Tab >/dev/null
echo "activeElement after 2xTab: $(ab eval 'JSON.stringify({tag: document.activeElement.tagName, label: document.activeElement.getAttribute("aria-label") || document.activeElement.textContent?.trim().slice(0,20), focusVisible: document.activeElement.matches(":focus-visible")})')"
echo "aria-labeled icon buttons: $(ab eval 'String([...document.querySelectorAll("button,a[aria-label],svg[aria-hidden]")].filter(e=>e.getAttribute("aria-label")).length)')"

echo "== 7. 404 page =="
ab open http://localhost:3000/series/does-not-exist >/dev/null
sleep 1.5
ab screenshot "$OUT/qa-c-404.png" >/dev/null
echo "404 h1: $(ab eval 'document.querySelector("h1")?.textContent')"

echo "== 8. Admin guard redirect (guest) =="
ab open http://localhost:3000/admin >/dev/null
sleep 2
echo "landed at: $(ab get url)"

ab close --all >/dev/null 2>&1
echo "== QA session complete =="
