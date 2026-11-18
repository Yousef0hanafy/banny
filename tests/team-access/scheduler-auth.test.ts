import { afterEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { isAuthorizedScheduler } = await import("../../src/lib/scheduler-auth");

const SECRET = "a-long-scheduler-secret-value";
const original = { editorial: process.env.EDITORIAL_CRON_SECRET, vercel: process.env.CRON_SECRET };
const request = (authorization?: string) =>
  new Request("http://127.0.0.1/api/editorial/publish-due", { headers: authorization ? { authorization } : {} });

afterEach(() => {
  process.env.EDITORIAL_CRON_SECRET = original.editorial;
  process.env.CRON_SECRET = original.vercel;
  if (original.editorial === undefined) delete process.env.EDITORIAL_CRON_SECRET;
  if (original.vercel === undefined) delete process.env.CRON_SECRET;
});

test("accepts the editorial secret and Vercel's CRON_SECRET", () => {
  process.env.EDITORIAL_CRON_SECRET = SECRET;
  delete process.env.CRON_SECRET;
  expect(isAuthorizedScheduler(request(`Bearer ${SECRET}`))).toBe(true);
  expect(isAuthorizedScheduler(request(`bearer ${SECRET}`))).toBe(true);
  delete process.env.EDITORIAL_CRON_SECRET;
  process.env.CRON_SECRET = SECRET;
  expect(isAuthorizedScheduler(request(`Bearer ${SECRET}`))).toBe(true);
});

test("rejects missing, wrong, empty and too-short secrets", () => {
  process.env.EDITORIAL_CRON_SECRET = SECRET;
  expect(isAuthorizedScheduler(request())).toBe(false);
  expect(isAuthorizedScheduler(request("Bearer "))).toBe(false);
  expect(isAuthorizedScheduler(request(`Bearer ${SECRET}x`))).toBe(false);
  expect(isAuthorizedScheduler(request(SECRET))).toBe(false);
  process.env.EDITORIAL_CRON_SECRET = "short";
  expect(isAuthorizedScheduler(request("Bearer short"))).toBe(false);
  delete process.env.EDITORIAL_CRON_SECRET;
  delete process.env.CRON_SECRET;
  expect(isAuthorizedScheduler(request("Bearer undefined"))).toBe(false);
});
