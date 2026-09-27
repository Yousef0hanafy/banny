#!/bin/bash
# Phase 0 research batch — Bunny Library discovery gate
# Saves each search result as JSON under /home/z/my-project/research/
set -u
OUT=/home/z/my-project/research
mkdir -p "$OUT"

run() {
  local slug="$1"; shift
  local query="$1"; shift
  local num="${1:-8}"
  echo "== $slug =="
  z-ai function -n web_search -a "{\"query\": \"$query\", \"num\": $num}" -o "$OUT/$slug.json" 2>&1 | tail -1
}

# ---- A. Market & competitors ----
run arabic-manga-market "Arabic manga platform market 2025 Saudi Arabia" 8
run manga-productions "Manga Productions Manga Arabia Saudi Arabia licensed Arabic manga" 8
run azora-platform "Azora Arabic manga manhwa platform azorafly" 8
run webtoon-arabic "WEBTOON Naver Arabic language support Middle East" 8
run manta-pocket-comics "Manta Tappytoon Pocket Comics Arabic manhwa" 6
run mangaplus-arabic "MANGA Plus Shueisha Arabic language" 6
run mena-market-size "Middle East webtoon comics market size growth forecast" 8
run ksa-comics-scene "Saudi Arabia manga comics community Saudi Comic Con anime" 6
run egypt-comics "Egypt Arabic comics manga webtoon market" 6
run arabic-webnovels "Arabic web novels platform Arabic reading apps subscription" 8
run ar-query "منصة عربية مانجا ومانهوا ويبتون رسمية" 8

# ---- B. Legal / licensing ----
run licensing-mena "manga licensing Arabic translation rights MENA publishers" 8
run saip-copyright "Saudi Arabia copyright law SAIP author rights" 6
run uae-copyright "UAE federal copyright law digital content" 5
run egypt-copyright "Egypt copyright law 82 books translation" 5

# ---- C. Technical ----
run nextjs-version "Next.js 16 App Router release stable" 8
run supabase-rls "Supabase Row Level Security policies best practices app.auth.uid" 8
run supabase-storage "Supabase Storage public bucket image transformations CDN" 6
run shadcn-tailwind "shadcn/ui Tailwind CSS v4 setup Next.js" 6
run rtl-typography "Arabic RTL website IBM Plex Sans Arabic Cairo font web best practices" 6
run nextjs-env "Next.js environment variables server client NEXT_PUBLIC best practices" 6
run sentry-nextjs "Sentry Next.js App Router setup error tracking" 5
run posthog-analytics "PostHog Next.js product analytics privacy" 5
run vercel-deploy "Vercel deploy Next.js Supabase architecture" 5

echo "ALL DONE"
ls -la "$OUT"
