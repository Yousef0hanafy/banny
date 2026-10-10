import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { isIP } from "node:net";

// Enable only behind a proxy that replaces this header; never trust client-provided forwarding by default.
export async function allowAccountClient(kind: string, forwardedFor?: string | null): Promise<boolean> {
  const trusted = process.env.ACCOUNT_TRUST_PROXY_HEADER === "1";
  const candidate = forwardedFor?.split(",")[0]?.trim();
  const address = trusted && candidate && isIP(candidate) ? candidate : null;
  return checkAndIncrementRateLimit(`client:${kind}:${address ?? "unidentified"}`, address ? 200 : 20000, 3600);
}

export function hashRateLimitKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Check and increment rate limit atomically.
 * Returns true if allowed, false if limit exceeded.
 */
export async function checkAndIncrementRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const keyHash = hashRateLimitKey(key);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.accountRateLimit.findUnique({
            where: { keyHash },
          });

          if (!existing || existing.windowEnd <= now) {
            // New window or expired
            await tx.accountRateLimit.upsert({
              where: { keyHash },
              update: { count: 1, windowEnd },
              create: { keyHash, count: 1, windowEnd },
            });
            return true;
          }

          if (existing.count >= limit) {
            return false;
          }

          await tx.accountRateLimit.update({
            where: { keyHash },
            data: { count: { increment: 1 } },
          });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err: any) {
      if (err?.code === "P2034" || err?.meta?.code === "40001" || err?.code === "P2002") {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 10 + Math.random() * 20));
          continue;
        }
        return false;
      }
      return false;
    }
  }

  return false;
}
