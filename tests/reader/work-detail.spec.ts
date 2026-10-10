import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  const { csrfToken } = await (await page.request.get("/api/auth/csrf")).json();
  await page.request.post("/api/auth/callback/credentials", { form: {
    csrfToken, email: "reader@bunny.demo", password: "bunny-reader-2026", json: "true",
  } });
}

for (const progress of [
  { chapterNumber: 1, percent: 45, format: "manga", resume: true, completed: false },
  { chapterNumber: 2, percent: 100, format: "manga", resume: false, completed: true },
  { chapterNumber: 4, percent: 45, format: "manga", resume: false, completed: false },
  { chapterNumber: 8, percent: 45, format: "manga", resume: false, completed: false },
  { chapterNumber: 1, percent: 45, format: "novel", resume: false, completed: false },
]) {
  test(`work detail: guest progress ${progress.format}/${progress.chapterNumber}/${progress.percent} stays valid`, async ({ page }) => {
    await page.addInitScript(p => {
      localStorage.setItem("bunny.progress.v1", JSON.stringify([{
        ...p, seriesSlug: "qa-reader-manga", seriesTitle: "اختبار", chapterTitle: "اختبار",
        pageIndex: 2, total: 5, coverPath: "", accent: "", updatedAt: Date.now(),
      }]));
    }, progress);
    await page.goto("/series/qa-reader-manga");
    const hero = page.getByRole("region", { name: "بيانات العمل الرئيسية", exact: true });
    await expect(hero.getByRole("link", { name: progress.resume ? /كمل الفصل 1/ : "ابدأ القراءة", exact: !progress.resume })).toHaveAttribute("href", "/read/manga/qa-reader-manga/1");
    const list = page.getByRole("list", { name: "قائمة الفصول", exact: true });
    if (progress.resume) await expect(list.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
    else await expect(list.getByRole("progressbar")).toHaveCount(0);
    await expect(list.getByText("تمت القراءة", { exact: true })).toHaveCount(progress.completed ? 1 : 0);
    await expect(page.getByRole("region", { name: "فصول مجدولة", exact: true }).getByRole("link")).toHaveCount(0);
    await page.getByRole("button", { name: "الترتيب الحالي: الأحدث أولاً", exact: true }).click();
    await expect(list.getByRole("link").first()).toHaveAttribute("href", "/read/manga/qa-reader-manga/1");
    await page.getByRole("searchbox", { name: "البحث في الفصول", exact: true }).fill("لا يوجد فصل بهذا الاسم");
    await expect(list.getByRole("listitem")).toHaveCount(0);
    await expect(page.getByText(/لا توجد فصول تطابق/)).toBeVisible();
  });
}

test("work detail: library persists chosen shelf and rolls back failed saves", async ({ page }) => {
  await signIn(page);
  await page.goto("/series/qa-reader-other");
  // Both projects use the same isolated reader. Recover its shelf even if a prior test failed before cleanup.
  if (await page.getByRole("button", { name: "أضف إلى مكتبتي", exact: true }).count() === 0) {
    const saved = page.getByRole("button", { name: /^(أقرؤها حاليًا|أرغب بقراءتها|أنهيتها)$/ });
    await expect(saved).toBeEnabled();
    await saved.click();
    await page.getByRole("menuitem", { name: "إزالة من مكتبتي", exact: true }).click();
  }
  await page.getByRole("button", { name: "أضف إلى مكتبتي", exact: true }).click();
  const reading = page.getByRole("button", { name: "أقرؤها حاليًا", exact: true });
  await expect(reading).toBeEnabled();
  await reading.click();
  await page.getByRole("menuitem", { name: "أنهيتها", exact: true }).click();
  await expect(page.getByRole("button", { name: "أنهيتها", exact: true })).toBeEnabled();
  await page.reload();
  const finished = page.getByRole("button", { name: "أنهيتها", exact: true });
  await expect(finished).toBeEnabled();
  await page.route("**/series/qa-reader-other", async route => {
    if (route.request().headers()["next-action"]) await route.abort("failed");
    else await route.continue();
  });
  await finished.click();
  await page.getByRole("menuitem", { name: "إزالة من مكتبتي", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "تعذّر حفظ التغيير" })).toBeVisible();
  await expect(finished).toBeEnabled();
  await page.unroute("**/series/qa-reader-other");
  await finished.click();
  await page.getByRole("menuitem", { name: "إزالة من مكتبتي", exact: true }).click();
  await expect(page.getByRole("button", { name: "أضف إلى مكتبتي", exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "أضف إلى مكتبتي", exact: true })).toBeEnabled();
});

test("work detail: rating preview and failed save never claim a persisted vote", async ({ page }) => {
  await signIn(page);
  await page.goto("/series/qa-reader-manga");
  await page.getByRole("tab", { name: "التقييمات والمجتمع", exact: true }).click();
  const stars = page.getByRole("radiogroup").getByRole("radio");
  const previous = await stars.evaluateAll(elements => elements.map(el => el.getAttribute("aria-checked")));
  await stars.last().hover();
  expect(await stars.evaluateAll(elements => elements.map(el => el.getAttribute("aria-checked")))).toEqual(previous);
  await page.route("**/series/qa-reader-manga", async route => {
    if (route.request().headers()["next-action"]) await route.abort("failed");
    else await route.continue();
  });
  await stars.last().click();
  await expect(page.getByRole("alert").filter({ hasText: "تعذّر حفظ تقييمك" })).toBeVisible();
  expect(await stars.evaluateAll(elements => elements.map(el => el.getAttribute("aria-checked")))).toEqual(previous);
  await page.unroute("**/series/qa-reader-manga");
  await stars.nth(3).click();
  await expect(stars.nth(3)).toBeEnabled();
  await page.reload();
  await page.getByRole("tab", { name: "التقييمات والمجتمع", exact: true }).click();
  await expect(page.getByRole("radio", { name: "4 من ٥", exact: true })).toHaveAttribute("aria-checked", "true");
});


test("work detail: missing cover stays neutral and older latest chapter is not new", async ({ page }) => {
  await page.goto("/series/qa-reader-other");
  await expect(page.getByRole("img", { name: "لا يوجد غلاف لهذا العمل", exact: true })).toBeVisible();
  const hero = page.getByRole("region", { name: "بيانات العمل الرئيسية", exact: true });
  await expect(hero.locator("img")).toHaveCount(0);
  const list = page.getByRole("list", { name: "قائمة الفصول", exact: true });
  await expect(list.locator("img")).toHaveCount(0);
  await expect(list.getByText("جديد", { exact: true })).toHaveCount(0);
  await expect(list.getByText("غير مقروء", { exact: true })).toHaveCount(3);
});
