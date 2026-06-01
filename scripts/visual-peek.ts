/**
 * 固定路径截图 — 用户浏览器 / Agent 对齐用同一张 LIVE.png
 *
 * Usage:
 *   npm run visual:peek
 *   npm run visual:peek -- --q="Where's the pen?" --a="The pen's on the book"
 *   npm run visual:peek -- --url=/zh/learn-preview?phase=question
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "tests/visual/snapshots");
const LIVE = join(OUT_DIR, "LIVE.png");
const LIVE_SCENE = join(OUT_DIR, "LIVE-scene.png");

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const q = arg("q", "What's this?");
  const a = arg("a", "It's a pen");
  const pathArg = arg("url", "");
  const url = pathArg
    ? `${base}${pathArg.startsWith("/") ? pathArg : `/${pathArg}`}`
    : `${base}/zh/learn-preview?phase=question`;

  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 860 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector('[data-testid="qa-scene"]', { timeout: 15_000 });

  await page.screenshot({ path: LIVE, fullPage: true });
  await page.locator('[data-testid="qa-scene"]').screenshot({ path: LIVE_SCENE });

  console.log(`📸 LIVE  → ${LIVE}`);
  console.log(`📸 scene → ${LIVE_SCENE}`);
  console.log(`🔗 ${url}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
