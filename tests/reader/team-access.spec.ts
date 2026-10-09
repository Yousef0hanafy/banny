import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { isolatedDatabaseURL } from "./qa-env.mjs";

const db = new PrismaClient({ datasources: { db: { url: isolatedDatabaseURL() } } });
test.afterAll(async () => { await db.$disconnect(); });

test("team access: unassigned editor cannot read another work's drafts", async ({ page }) => {
  const series = await db.series.findUniqueOrThrow({ where: { slug: "qa-reader-novel" } });
  const csrf = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrf.json();
  const login = await page.request.post("/api/auth/callback/credentials", { form: {
    csrfToken, email: "editor@bunny.demo", password: "bunny-editor-2026", json: "true",
  } });
  expect(login.ok()).toBe(true);
  const session = await page.request.get("/api/auth/session");
  expect((await session.json()).user.email).toBe("editor@bunny.demo");
  await page.goto(`/admin/series/${series.id}`);
  await expect(page.getByText("رحلة الاختبار 4", { exact: true })).toHaveCount(0);
  await page.goto("/admin/chapters?workflow=draft");
  await expect(page.getByText("رحلة الاختبار 4", { exact: true })).toHaveCount(0);
});
