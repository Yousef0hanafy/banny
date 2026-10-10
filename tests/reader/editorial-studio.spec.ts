import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { isolatedDatabaseURL } from "./qa-env.mjs";

const db = new PrismaClient({ datasources: { db: { url: isolatedDatabaseURL() } } });

test("visual chapters can submit without false unsaved changes", async ({ page }, testInfo) => {
  await loginAsAdmin(page);
  const chapter = await db.chapter.findFirstOrThrow({ where: { series: { slug: "qa-reader-manga" }, number: 1 } });
  await db.chapterRevision.deleteMany({ where: { chapterId: chapter.id } });
  await page.goto(`/studio/chapters/${chapter.id}`);
  const submit = page.getByRole("button", { name: "إرسال للمراجعة التحريرية" });
  await expect(submit).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("visual-editor.png"), fullPage: true });
  await submit.click();
  await expect(page.getByText("أُرسلت للمراجعة", { exact: true })).toBeVisible();
});

const FIXTURE_SLUG = "qa-studio-novel-fixture";
const FIXTURE_TITLE = "رواية الاستوديو التحريري التجريبية";
const INITIAL_BODY = "هذا هو النص الأصلي للرواية قبل دورة التحرير والمراجعة.";
const UPDATED_BODY = "هذا هو النص المحدث بعد التحرير الشامل والاعتماد التحريري في الاستوديو.";

async function loginAsAdmin(page: Page) {
  const csrf = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrf.json();
  const res = await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: "admin@bunny.demo",
      password: "bunny-admin-2026",
      json: "true",
    },
  });
  expect(res.ok()).toBe(true);
}

test.beforeAll(async () => {
  // Ensure clean fixture series and chapter
  const existing = await db.series.findUnique({ where: { slug: FIXTURE_SLUG } });
  if (existing) {
    await db.chapter.deleteMany({ where: { seriesId: existing.id } });
    await db.series.delete({ where: { id: existing.id } });
  }

  const series = await db.series.create({
    data: {
      slug: FIXTURE_SLUG,
      titleAr: FIXTURE_TITLE,
      synopsisAr: "وصف تجريبي مخصص لاختبار استوديو التحرير والمراجعة.",
      format: "novel",
      status: "ongoing",
      author: "كاتب تجريبي",
      genresJson: JSON.stringify(["دراما", "فانتازيا"]),
      accent: "#9B7BFF",
      coverPath: "/art/covers/warden-of-the-twilight-gate.webp",
    },
  });

  // Create an initial chapter directly in DB
  await db.chapter.create({
    data: {
      seriesId: series.id,
      number: 1,
      titleAr: "الفصل الأول التجريبي",
      workflow: "published",
      publishedAt: new Date(),
      readingDirection: "rtl",
      novelBody: INITIAL_BODY,
    },
  });
});

test.afterAll(async () => {
  const series = await db.series.findUnique({ where: { slug: FIXTURE_SLUG } });
  if (series) {
    await db.chapter.deleteMany({ where: { seriesId: series.id } });
    await db.series.delete({ where: { id: series.id } });
  }
  await db.$disconnect();
});

test("Test 1: Guest cannot render studio editor and is redirected to login", async ({
  page,
}) => {
  const chapter = await db.chapter.findFirstOrThrow({
    where: { series: { slug: FIXTURE_SLUG }, number: 1 },
  });

  await page.goto(`/studio/chapters/${chapter.id}`);
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
  await expect(page.getByText(/تسجيل الدخول/)).toBeVisible();
});

test("Test 2: Full editorial cycle: edit draft, submit, approve, and publish -> public reader verifies text change", async ({
  page,
}) => {
  const chapter = await db.chapter.findFirstOrThrow({
    where: { series: { slug: FIXTURE_SLUG }, number: 1 },
  });

  // Verify before publish: guest reader does NOT see new published text (workflow is still draft)
  await page.goto(`/read/novel/${FIXTURE_SLUG}/1`);
  // When chapter is draft, the reader page either 404s or shows unauthenticated/draft notice
  // But certainly does NOT contain UPDATED_BODY
  await expect(page.getByText(UPDATED_BODY)).toHaveCount(0);
  await expect(page.getByText(INITIAL_BODY)).toBeVisible();

  // Now login as Admin
  await loginAsAdmin(page);

  // Go to studio chapter page
  await page.goto(`/studio/chapters/${chapter.id}`);
  await expect(page.getByRole("heading", { name: /إدارة نسخة الفصل 1/ })).toBeVisible();

  // Edit the novel body
  const textarea = page.locator("textarea");
  await textarea.fill(UPDATED_BODY);
  await expect(page.getByRole("button", { name: "إرسال للمراجعة التحريرية" })).toBeDisabled();

  // Save the draft
  const saveBtn = page.getByRole("button", { name: "حفظ المسودة" });
  await saveBtn.click();
  await expect(page.getByText("تم الحفظ بنجاح", { exact: true })).toBeVisible();
  const publicBeforeApproval = await page.request.get(`/read/novel/${FIXTURE_SLUG}/1`);
  const publicText = await publicBeforeApproval.text();
  expect(publicText).toContain(INITIAL_BODY);
  expect(publicText).not.toContain(UPDATED_BODY);

  // Submit for review
  const submitReviewBtn = page.getByRole("button", { name: "إرسال للمراجعة التحريرية" });
  await submitReviewBtn.click();
  await expect(page.getByText("أُرسلت للمراجعة", { exact: true })).toBeVisible();

  // Approve revision
  const approveBtn = page.getByRole("button", { name: "اعتماد النسخة رسميًا" });
  await approveBtn.click();
  await expect(page.getByText("تم الاعتماد الرسمي", { exact: true })).toBeVisible();

  // Publish now
  const publishBtn = page.getByRole("button", { name: "نشر النسخة الآن في المكتبة" });
  await publishBtn.click();
  await expect(page.getByText("تم النشر بنجاح!", { exact: true })).toBeVisible();

  // Assert public reader projection: exact new text is now visible to readers
  await page.goto(`/read/novel/${FIXTURE_SLUG}/1`);
  await expect(page.getByRole("main", { name: "نص الفصل" }).getByText(UPDATED_BODY)).toBeVisible();
});

test("unauthorized scheduler calls cannot mutate publication", async ({ request }) => {
  const post = await request.post("/api/editorial/publish-due", { headers: { authorization: "Bearer " } });
  expect(post.status()).toBe(401);
  expect((await request.get("/api/editorial/publish-due")).status()).toBe(405);
});

test("Test 3: Mobile responsiveness: no horizontal overflow and controls are accessible", async ({
  page,
  isMobile,
}) => {
  await loginAsAdmin(page);
  await page.setViewportSize({ width: 375, height: 667 });

  const chapter = await db.chapter.findFirstOrThrow({
    where: { series: { slug: FIXTURE_SLUG }, number: 1 },
  });

  await page.goto(`/studio/chapters/${chapter.id}`);
  await expect(page.getByRole("heading", { name: /إدارة نسخة الفصل 1/ })).toBeVisible();

  // Check no horizontal scroll overflow
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const innerWidth = await page.evaluate(() => window.innerWidth);
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 2); // allowance for subpixel rounding

  // Controls meet touch target minimum height 44px
  const returnHomeLink = page.getByRole("link", { name: "العودة للقائمة" });
  await expect(returnHomeLink).toBeVisible();
  const box = await returnHomeLink.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
});
