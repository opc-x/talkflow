/**
 * One-time login for Playwright MCP — saves cookies so @Browser can open /protected/* URLs.
 *
 *   npm run browser:auth
 *
 * A Chrome window opens on /zh/auth/login. Log in, then press Enter in the terminal.
 * Writes talkflow/.playwright/auth.json (gitignored).
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import readline from "node:readline";

const AUTH_DIR = join(process.cwd(), ".playwright");
const AUTH_FILE = join(AUTH_DIR, "auth.json");
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

function waitEnter(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true });

  console.log(`\n🔐 TalkFlow browser auth → ${AUTH_FILE}`);
  console.log(`   Base URL: ${BASE}`);
  if (existsSync(AUTH_FILE)) {
    console.log("   (overwriting existing auth.json)\n");
  }

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 860 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/zh/auth/login`, { waitUntil: "networkidle" });

  await waitEnter(
    "\n✅ Log in in the Chrome window, then press Enter here to save session… ",
  );

  await page.goto(`${BASE}/zh/protected/learn/1/1`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  if (page.url().includes("/auth/login")) {
    await browser.close();
    throw new Error("Still on login page — complete sign-in before pressing Enter.");
  }

  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`\n✅ Saved ${AUTH_FILE}`);
  console.log("   Reload Cursor MCP (playwright) then @Browser can open protected URLs.\n");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
