import { mock } from "bun:test";
import { AsyncLocalStorage } from "node:async_hooks";
import { isolatedDatabaseURL } from "../reader/qa-env.mjs";

isolatedDatabaseURL();
let actorId: string | null = null;
const requestActor = new AsyncLocalStorage<{ id: string | null }>();
mock.module("server-only", () => ({}));
mock.module("next-auth", () => ({
  getServerSession: async () => {
    const request = requestActor.getStore();
    const id = request ? request.id : actorId;
    return id ? { user: { id } } : null;
  },
}));
mock.module("next/cache", () => ({ revalidatePath: () => {} }));

export const { db } = await import("../../src/lib/db");
export const actions = await import("../../src/lib/actions");
export function setActor(id: string | null) { actorId = id; }
/** Separate identities for concurrent real-action calls, just like requests. */
export function withActor<T>(id: string | null, work: () => T): T {
  return requestActor.run({ id }, work);
}
