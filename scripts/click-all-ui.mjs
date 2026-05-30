/**
 * Dev-only: click every visible link/button on main routes. Logs results.
 * Usage: node scripts/click-all-ui.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const LOCALE = "zh";

const ROUTES = [
  `/${LOCALE}`,
  `/${LOCALE}/auth/login`,
  `/${LOCALE}/auth/sign-up`,
  `/${LOCALE}/auth/forgot-password`,
  `/${LOCALE}/protected`,
  `/${LOCALE}/protected/map`,
  `/${LOCALE}/protected/review`,
  `/${LOCALE}/protected/progress`,
  `/${LOCALE}/protected/stats`,
  `/${LOCALE}/protected/me`,
  `/${LOCALE}/protected/settings`,
  `/${LOCALE}/protected/tools`,
  `/${LOCALE}/onboarding`,
  `/${LOCALE}/protected/preview/new-user`,
  `/${LOCALE}/protected/preview/returning-user`,
  `/${LOCALE}/protected/learn/1/1`,
];

async function collectInteractives(page) {
  return page.evaluate(() => {
    const sel =
      'a[href], button:not([disabled]), [role="button"]:not([disabled]), summary, input[type="submit"], label[for]';
    return [...document.querySelectorAll(sel)].map((el, i) => {
      const rect = el.getBoundingClientRect();
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(el).visibility !== "hidden" &&
        getComputedStyle(el).display !== "none";
      const text = (
        el.innerText ||
        el.getAttribute("aria-label") ||
        el.getAttribute("name") ||
        el.id ||
        ""
      )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 60);
      return {
        i,
        tag: el.tagName,
        text: text || "(no label)",
        href: el.href || null,
        visible,
      };
    });
  });
}

async function clickByIndex(page, index) {
  return page.evaluate((idx) => {
    const sel =
      'a[href], button:not([disabled]), [role="button"]:not([disabled]), summary, input[type="submit"], label[for]';
    const els = [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        getComputedStyle(el).visibility !== "hidden" &&
        getComputedStyle(el).display !== "none"
      );
    });
    const el = els[idx];
    if (!el) return { ok: false, reason: "missing" };
    const before = location.href;
    const text = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 60);
    el.click();
    return { ok: true, text, before, after: location.href };
  }, index);
}

const log = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const path of ROUTES) {
    const url = `${BASE}${path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      log.push({ route: path, error: `goto: ${e.message}` });
      continue;
    }

    const items = (await collectInteractives(page)).filter((x) => x.visible);
    log.push({ route: path, url: page.url(), interactives: items.length });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        const res = await clickByIndex(page, i);
        await page.waitForTimeout(400);
        log.push({
          route: path,
          i,
          label: item.text,
          href: item.href,
          click: res,
          finalUrl: page.url(),
        });
      } catch (e) {
        log.push({ route: path, i, label: item.text, error: e.message });
      }
    }
  }

  await browser.close();
  console.log(JSON.stringify(log, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
