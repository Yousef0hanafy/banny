import { test, expect } from "@playwright/test";

for (const format of ["manga", "webtoon", "novel"]) {
  test(`reader experience: ${format} direct chapter selection stays public and within the work`, async ({ page }) => {
    await page.goto(`/read/${format}/qa-reader-${format}/1`);
    const selector = page.getByRole("combobox", { name: "اختيار الفصل", exact: true }).first();
    const values = await selector.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
    expect(values).toEqual(["1", "2", "8", "10"]);
    await selector.selectOption("2");
    await expect(page).toHaveURL(`/read/${format}/qa-reader-${format}/2`);
    await expect(page.getByRole("combobox", { name: "اختيار الفصل", exact: true }).first()).toHaveValue("2");
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("bunny.progress.v1") ?? "[]")[0]?.chapterNumber)).toBe(2);
    const before = await page.evaluate(() => localStorage.getItem("bunny.progress.v1"));
    await page.getByRole("combobox", { name: "اختيار الفصل", exact: true }).first().selectOption("8");
    await expect(page.getByRole("heading", { name: "فصل تجريبي مقفل", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("bunny.progress.v1"))).toBe(before);
  });
}

test("reader experience: vertical width persists and focus mode keeps hidden tools out of keyboard navigation", async ({ page }) => {
  await page.goto("/read/webtoon/qa-reader-webtoon/1");
  await page.getByRole("button", { name: "إعدادات القراءة", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "إعدادات القراءة", exact: true });
  await dialog.getByRole("button", { name: "مضغوط", exact: true }).click();
  await dialog.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "إعدادات القراءة", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "مضغوط", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.press("Escape");
  await page.getByRole("button", { name: "وضع القراءة العميقة", exact: true }).click();
  const show = page.getByRole("button", { name: "إظهار أدوات القراءة", exact: true }).last();
  await expect(show).toBeVisible();
  await page.locator("body").press("Tab");
  await expect(show).toBeFocused();
  await show.press("Enter");
  await expect(page.getByRole("button", { name: "إعدادات القراءة", exact: true })).toBeVisible();
});

test("reader experience: novel font and paper preferences work and survive reload", async ({ page }) => {
  await page.goto("/read/novel/qa-reader-novel/1");
  await page.getByRole("button", { name: "إعدادات القراءة", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "إعدادات القراءة", exact: true });
  await dialog.getByRole("button", { name: "تكبير الخط", exact: true }).click();
  await dialog.getByRole("button", { name: "سمة ورقية", exact: true }).click();
  await dialog.press("Escape");
  await expect(page.getByRole("main", { name: "نص الفصل", exact: true }).locator("article p").nth(1)).toHaveCSS("font-size", "19px");
  await page.reload();
  await page.getByRole("button", { name: "إعدادات القراءة", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "سمة ورقية", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("bunny.novel.fontSize.v1"))).toBe("19");
});

test("reader experience: manga shortcuts leave settings controls and dialogs alone", async ({ page }) => {
  await page.goto("/read/manga/qa-reader-manga/1");
  await expect(page.getByRole("img", { name: "صفحة 1 من 5", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "إعدادات القراءة", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "إعدادات القراءة", exact: true });
  const direction = dialog.getByRole("button", { name: "تبديل اتجاه المانجا", exact: true });
  await direction.press("ArrowLeft");
  await direction.press("f");
  await expect(dialog).toBeVisible();
  await dialog.press("Escape");
  await expect(page.getByRole("img", { name: "صفحة 1 من 5", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "اختيار الفصل", exact: true }).first().press("ArrowLeft");
  await expect(page.getByRole("img", { name: "صفحة 1 من 5", exact: true })).toBeVisible();
  const next = page.getByRole("button", { name: "الصفحة التالية", exact: true });
  await next.click();
  await expect(page.getByRole("img", { name: "صفحة 2 من 5", exact: true })).toBeVisible();
  await next.press("ArrowLeft");
  await expect(page.getByRole("img", { name: "صفحة 3 من 5", exact: true })).toBeVisible();
  await next.press("f");
  await expect(page.getByRole("button", { name: "إظهار أدوات القراءة", exact: true }).last()).toBeVisible();
});

test("reader experience: a failed chapter image can be retried without changing pages", async ({ page }) => {
  await page.route("**/_next/image**", async route => {
    const source = new URL(route.request().url()).searchParams.get("url");
    if (source?.endsWith("/p01.webp")) await route.abort("failed");
    else await route.continue();
  });
  await page.goto("/read/manga/qa-reader-manga/1");
  const error = page.getByRole("alert").filter({ hasText: "تعذّر تحميل صفحة 1 من 5" });
  await expect(error).toBeVisible();
  await page.unroute("**/_next/image**");
  await error.getByRole("button", { name: "إعادة المحاولة", exact: true }).click();
  await expect(page.getByRole("img", { name: "صفحة 1 من 5", exact: true })).toBeVisible();
  await expect.poll(async () => page.getByRole("img", { name: "صفحة 1 من 5", exact: true }).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(error).toHaveCount(0);
});
