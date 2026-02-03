import { test, expect } from "@playwright/test";

test("page renders and accepts input", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const textarea = page.getByLabel("报文内容");
  await expect(textarea).toBeVisible();
  await textarea.fill("METAR ZBAA 011200Z 02005MPS 6000 HZ SCT020 BKN050 02/M03 Q1015");
  const decodeButton = page.getByRole("button", { name: "解读" });
  await expect(decodeButton).toBeEnabled();
});
