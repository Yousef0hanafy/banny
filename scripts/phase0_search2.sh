#!/bin/bash
# Phase 0 follow-up research batch
set -u
OUT=/home/z/my-project/research
run() {
  local slug="$1"; shift
  local query="$1"; shift
  local num="${1:-6}"
  echo "== $slug =="
  z-ai function -n web_search -a "{\"query\": \"$query\", \"num\": $num}" -o "$OUT/$slug.json" 2>&1 | tail -1
}

run sentry-nextjs2 "Sentry for Next.js official documentation installation" 6
run manga-arabia-webtoons "Manga Arabia Korean webtoons Arabic app launch" 8
run rakuten-mangaoasis "Rakuten MangaOasis Arabic digital comics launch" 6
run wattpad-arabic "Wattpad Arabic stories readers MENA" 6
run saudi-comic-con "Saudi Comic Con manga anime community Riyadh 2025" 6
run supabase-ssr "supabase ssr package Next.js App Router authentication official" 6
run nextjs-server-actions "Next.js server actions data mutation App Router" 5
run supabase-free-tier "Supabase pricing free tier projects limits" 5

echo "FOLLOW-UP DONE"
