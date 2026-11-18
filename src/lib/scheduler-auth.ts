import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Shared-secret check for the scheduled-publication trigger. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function isAuthorizedScheduler(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/i.exec(header);
  if (!match) return false;
  const presented = digest(match[1].trim());
  const secrets = [process.env.EDITORIAL_CRON_SECRET, process.env.CRON_SECRET]
    .map(secret => secret?.trim())
    .filter((secret): secret is string => Boolean(secret && secret.length >= 16));
  // Constant-time comparison of equal-length digests.
  return secrets.some(secret => timingSafeEqual(presented, digest(secret)));
}
