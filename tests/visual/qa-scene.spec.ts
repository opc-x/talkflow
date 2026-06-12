import { test, expect } from "playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "tests/visual/snapshots");

const CASES = [
  { name: "whats-this-pen", q: "What's this?", a: "It's a pen" },
  { name: "is-pen-no-pencil", q: "Is this a pen?", a: "No, it isn't a pen; it's a pencil" },
  { name: "where-pen-on-book", q: "Where's the pen?", a: "The pen's on the book" },
  { name: "pen-under-book", q: "Is the pen in the book?", a: "No, the pen isn't in the book; it's under the book" },
];

test.describe("QaScene visual capture", () => {
  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
  });

  for (const { name, q, a } of CASES) {
    test(`capture ${name}`, async ({ page }) => {
      const url = `/zh/qa-scene-preview?q=${encodeURIComponent(q)}&a=${encodeURIComponent(a)}&artPack=talkflow_desk_focus`;
      await page.goto(url);
      await page.waitForSelector('[data-testid="qa-scene"]', { timeout: 30_000 });

      const scene = page.locator('[data-testid="qa-scene"]');
      await expect(scene).toBeVisible();

      await page.screenshot({
        path: join(OUT, `${name}-page.png`),
        fullPage: true,
      });

      await scene.screenshot({
        path: join(OUT, `${name}-scene.png`),
      });
    });
  }
});
