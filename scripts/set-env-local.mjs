/**
 * set-env-local.mjs — Safely upsert one variable into .env.local.
 * Value arrives on STDIN (never argv), is never echoed, never logged.
 * Preserves file mode 0600. Usage: node scripts/set-env-local.mjs KEY < value.txt
 */
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";

const key = process.argv[2];
if (!key || !/^[A-Z_][A-Z0-9_]*$/.test(key)) {
  console.error("usage: node scripts/set-env-local.mjs KEY  (value on stdin)");
  process.exit(2);
}

let val = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) val += chunk;
val = val.trim();
if (!val || /[\r\n]/.test(val)) {
  console.error("ERROR: empty or multi-line value rejected");
  process.exit(2);
}

const path = new URL("../.env.local", import.meta.url);
let text = existsSync(path) ? readFileSync(path, "utf8") : "";

const line = `${key}="${val}"`;
const re = new RegExp(`^${key}=.*$`, "m");
if (re.test(text)) {
  text = text.replace(re, line);
} else {
  text = text.replace(/\s*$/, "");
  text = (text ? text + "\n" : "") + line + "\n";
}

writeFileSync(path, text, { mode: 0o600 });
chmodSync(path, 0o600);
console.log(`${key}: upserted into .env.local (value never printed; mode 0600 kept)`);
