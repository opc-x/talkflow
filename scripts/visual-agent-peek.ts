/**
 * Agent 自检：多题截图 → tests/visual/snapshots/agent-*.png
 *
 *   npm run visual:agent
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "tests/visual/snapshots");

const CASES = [
  { slug: "whats-pen", q: "What's this?", a: "It's a pen" },
  { slug: "no-pencil", q: "Is this a pen?", a: "No, it isn't a pen; it's a pencil" },
  { slug: "pen-on-book", q: "Where's the pen?", a: "The pen's on the book" },
  {
    slug: "learn-q0",
    url: "/zh/learn-preview?phase=question&seg=0&pair=0",
  },
] as const;

async function main() {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });

  for (const c of CASES) {
    const url =
      "url" in c
        ? `${base}${c.url}`
        : `${base}/zh/qa-scene-preview?q=${encodeURIComponent(c.q)}&a=${encodeURIComponent(c.a)}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector('[data-testid="qa-scene"]', { timeout: 15_000 });
    const scenePath = join(OUT, `agent-${c.slug}-scene.png`);
    await page.locator('[data-testid="qa-scene"]').screenshot({ path: scenePath });
    console.log(`📸 ${scenePath}`);
    console.log(`   ${url}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
