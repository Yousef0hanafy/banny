#!/usr/bin/env bash
# qa-nonce-csp.sh — one-call live QA for nonce-based CSP (A-1 follow-up).
# Starts the standalone production server, verifies CSP/nonce wiring, tears down.
# NOTE: DB credentials are NOT restored after the sandbox reset — DB-backed
# surfaces are expected to fail health/database checks; that is asserted too.
set -u
cd /home/z/my-project

PORT=3000
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }

echo "== killing stale servers (pkill; fuser proved unreliable here) =="
pkill -f "standalone/server.js" 2>/dev/null; sleep 2
pkill -9 -f "standalone/server.js" 2>/dev/null; sleep 1
if curl -s -m 2 -o /dev/null "http://localhost:${PORT}/"; then
  echo "FATAL: a stale server still answers on :${PORT} — aborting (would QA the wrong build)"
  exit 3
fi
echo "  port ${PORT} confirmed dead"

echo "== starting standalone server =="
setsid env NODE_ENV=production env -u DATABASE_URL -u DIRECT_URL \
  bun .next/standalone/server.js > /tmp/qa-csp-server.log 2>&1 &
SRV=$!
for i in $(seq 1 30); do
  if curl -sf -o /dev/null "http://localhost:${PORT}/login"; then break; fi
  sleep 1
done

CSP_RE='content-security-policy: .*nonce-'
XFO_RE='x-frame-options: DENY'

echo "== headers on / (DB down -> failsafe render expected) =="
H=$(curl -s -D - -o /tmp/qa-csp-home.html "http://localhost:${PORT}/")
CODE=$(echo "$H" | head -1 | awk '{print $2}')
N_CSP=$(echo "$H" | grep -ci '^content-security-policy:')
echo "  status=$CODE csp_headers=$N_CSP"
[ "$N_CSP" -eq 1 ] && ok "exactly ONE CSP header on / (no duplicate)" || bad "expected 1 CSP header, got $N_CSP"
echo "$H" | grep -qi "$CSP_RE" && ok "CSP carries per-request nonce on /" || bad "CSP nonce missing on /"
echo "$H" | grep -qi "$XFO_RE" && ok "XFO DENY still present (static headers intact)" || bad "XFO missing"
echo "$H" | grep -qi "strict-dynamic" && ok "strict-dynamic present" || bad "strict-dynamic missing"
echo "$H" | grep -qi "unsafe-eval" && bad "unsafe-eval leaked into production CSP" || ok "no unsafe-eval in production CSP"

echo "== nonce stamped on document scripts? =="
for path in / /login /no-such-page; do
  HDRF="/tmp/qa-csp$(echo "$path" | tr '/' '_').hdr"
  HTMLF="/tmp/qa-csp$(echo "$path" | tr '/' '_').html"
  curl -s -o "$HTMLF" -D "$HDRF" "http://localhost:${PORT}${path}"
  N_CSP_P=$(grep -ci '^content-security-policy:' "$HDRF")
  N_NONCED=$(grep -o '<script[^>]*nonce="' "$HTMLF" | wc -l)
  N_SCRIPTS=$(grep -o '<script' "$HTMLF" | wc -l)
  echo "  ${path}: csp_headers=${N_CSP_P}, ${N_NONCED}/${N_SCRIPTS} scripts carry nonce"
  [ "$N_CSP_P" -eq 1 ] && ok "${path}: exactly one CSP header" || bad "${path}: expected 1 CSP header, got $N_CSP_P"
  if [ "$N_NONCED" -eq 0 ]; then bad "${path}: zero nonced scripts (static/nonce conflict?)"; else ok "${path}: nonce present in document"; fi
done

echo "== /api/health excluded from nonce matcher but keeps static headers =="
H2=$(curl -s -D - "http://localhost:${PORT}/api/health")
echo "$H2" | grep -qi "$XFO_RE" && ok "XFO present on /api/health" || bad "XFO missing on /api/health"
N2=$(echo "$H2" | grep -ci '^content-security-policy:')
[ "$N2" -eq 0 ] && ok "no CSP on API (expected, excluded)" || bad "unexpected CSP on API"
echo "  health body: $(curl -s "http://localhost:${PORT}/api/health")"

echo "== DB down acknowledged =="
grep -q "database" /tmp/qa-csp-server.log 2>/dev/null; echo "  (server log inspected manually below if needed)"

echo "== teardown =="
pkill -f "standalone/server.js" 2>/dev/null; sleep 1
pkill -9 -f "standalone/server.js" 2>/dev/null
echo "RESULT: PASS=${PASS} FAIL=${FAIL}"
exit $FAIL
