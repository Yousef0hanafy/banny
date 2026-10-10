import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { isolatedDatabaseURL } from "./qa-env.mjs";

const db = new PrismaClient({ datasources: { db: { url: isolatedDatabaseURL() } } });
const password = "Reader-password-2026!";
const resetPassword = "Reader-reset-2026!";
let readerEmail: string;
let teamEmail: string;
const destination = "/series/warden-of-the-twilight-gate?account-return=1";

async function capturedLink(email: string, route: string) {
  const root = process.env.ACCOUNT_MAIL_LOCAL_DIR!;
  for (const file of (await readdir(root)).sort().reverse()) {
    if (!file.endsWith(".json")) continue;
    const mail = JSON.parse(await readFile(path.join(root, file), "utf8"));
    if (mail.to === email && mail.text.includes(route)) {
      const link = mail.text.match(/https?:\/\/[^\s]+/)?.[0];
      if (link) return link;
    }
  }
  throw new Error("Expected a private local captured message");
}

async function apiLogin(page: Page, email = "admin@bunny.demo", secret = "bunny-admin-2026") {
  const { csrfToken } = await (await page.request.get("/api/auth/csrf")).json();
  const response = await page.request.post("/api/auth/callback/credentials", { form: { csrfToken, email, password: secret, json: "true" } });
  expect(response.ok()).toBe(true);
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
}

test.beforeAll(async ({}, info) => {
  const suffix = `${info.project.name}-${Date.now()}`;
  readerEmail = `qa-account-reader-${suffix}@bunny.test`;
  teamEmail = `qa-account-team-${suffix}@bunny.test`;
});

test.afterAll(async () => {
  await db.accountToken.deleteMany({ where: { email: { in: [readerEmail, teamEmail] } } });
  await db.profile.deleteMany({ where: { email: { in: [readerEmail, teamEmail] } } });
  await db.$disconnect();
});

test("reader registers, confirms explicitly and skips onboarding back to the original work", async ({ page }, info) => {
  await page.goto(`/register?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(readerEmail);
  await page.getByLabel("الاسم الظاهر", { exact: true }).fill("قارئ البداية");
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByLabel("تأكيد كلمة المرور", { exact: true }).fill(password);
  await expectNoOverflow(page);
  await page.screenshot({ path: info.outputPath("registration.png"), fullPage: true });
  await page.getByRole("button", { name: "إنشاء الحساب", exact: true }).click();
  await expect.poll(async () => (await db.profile.findUnique({ where: { email: readerEmail } }))?.role).toBe("reader");
  await expect.poll(async () => { try { return await capturedLink(readerEmail, "/verify-email"); } catch { return ""; } }).not.toBe("");
  const link = await capturedLink(readerEmail, "/verify-email");
  await page.goto(link);
  expect((await db.profile.findUniqueOrThrow({ where: { email: readerEmail } })).emailVerifiedAt).toBeNull();
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByLabel("تأكيد كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: /تأكيد البريد/ }).click();
  await expect.poll(async () => Boolean((await db.profile.findUniqueOrThrow({ where: { email: readerEmail } })).emailVerifiedAt)).toBe(true);
  await page.goto(`/login?next=${encodeURIComponent(destination)}`);
  await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(readerEmail);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL(/\/welcome/);
  await expectNoOverflow(page);
  await page.getByRole("button", { name: "تخطي هذه الخطوة", exact: true }).click();
  await page.waitForURL(url => url.pathname === "/series/warden-of-the-twilight-gate" && url.searchParams.get("account-return") === "1");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "قارئ البداية", exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.goto("/library");
  await expect(page.getByRole("link", { name: /استكشف/ }).first()).toBeVisible();
});

test("reader recovers a password through an expiring one-use email link", async ({ page }) => {
  await apiLogin(page, readerEmail, password);
  expect((await (await page.request.get("/api/auth/session")).json())?.user?.id).toBeTruthy();
  await page.goto("/forgot-password");
  await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(readerEmail);
  await page.getByRole("button", { name: /إرسال/ }).click();
  await expect.poll(async () => {
    try { return await capturedLink(readerEmail, "/reset-password"); } catch { return ""; }
  }).not.toBe("");
  const link = await capturedLink(readerEmail, "/reset-password");
  await page.goto(link);
  await page.getByLabel(/كلمة المرور الجديدة/, { exact: true }).fill(resetPassword);
  await page.getByLabel(/تأكيد كلمة المرور/, { exact: true }).fill(resetPassword);
  await page.getByRole("button", { name: /تعيين|حفظ كلمة المرور/ }).click();
  await expect.poll(async () => (await db.profile.findUniqueOrThrow({ where: { email: readerEmail } })).authVersion).toBe(1);
  expect((await (await page.request.get("/api/auth/session")).json())?.user?.id).toBeUndefined();
  await apiLogin(page, readerEmail, resetPassword);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "قارئ البداية", exact: true })).toBeVisible();
});

test("admin invites a team member and the accepted account gets only its assigned role", async ({ page }, info) => {
  await apiLogin(page);
  await page.goto("/admin/users");
  await page.getByLabel("البريد الإلكتروني للعضو", { exact: true }).fill(teamEmail);
  await page.getByLabel("الدور الممنوح", { exact: true }).click();
  await page.getByRole("option", { name: "مساهم", exact: true }).click();
  await page.getByRole("button", { name: "إرسال الدعوة", exact: true }).click();
  await expect.poll(async () => await db.accountToken.count({ where: { email: teamEmail, purpose: "invite" } })).toBe(1);
  await expectNoOverflow(page);
  await page.screenshot({ path: info.outputPath("team-accounts.png"), fullPage: true });
  await expect.poll(async () => { try { return await capturedLink(teamEmail, "/accept-invitation"); } catch { return ""; } }).not.toBe("");
  const link = await capturedLink(teamEmail, "/accept-invitation");
  await page.context().clearCookies();
  await page.goto(link);
  await page.getByLabel(/الاسم الظاهر/).fill("عضو الفريق");
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByLabel("تأكيد كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "إنشاء الحساب وقبول الدعوة", exact: true }).click();
  await expect.poll(async () => (await db.profile.findUnique({ where: { email: teamEmail } }))?.role).toBe("contributor");
  await apiLogin(page, teamEmail, password);
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: "استوديو التحرير وسير العمل", exact: true })).toBeVisible();
  await page.goto("/admin/mailbox");
  await expect(page.getByText(readerEmail, { exact: true })).toHaveCount(0);
});

test("guest reading stays open and login rejects external return destinations", async ({ page }) => {
  await page.goto("/read/novel/qa-reader-novel/1");
  expect(new URL(page.url()).pathname).toContain("/read/novel/");
  await page.goto("/login?next=%2F%2Fevil.example");
  await page.getByLabel("البريد الإلكتروني", { exact: true }).fill(readerEmail);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(resetPassword);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL(url => url.pathname === "/");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});
