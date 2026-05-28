/**
 * TalkFlow UI Smoke Test — Playwright headless click-through
 *
 * Usage:
 *   npx tsx scripts/ui-smoke.ts
 *
 * Requires: @playwright/test chromium installed
 *   npx playwright install chromium
 */

import { chromium, type Page, type Browser } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const REPORT_DIR = path.join(process.cwd(), ".opc", "outputs");
const SCREENSHOT_DIR = path.join(REPORT_DIR, "screenshots");
const REPORT_PATH = path.join(REPORT_DIR, "playwright-report.md");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface CheckResult {
  path: string;
  label: string;
  status: "PASS" | "FAIL" | "WARN";
  note: string;
  screenshot?: string;
  consoleErrors: string[];
}

async function shot(page: Page, name: string): Promise<string> {
  const file = `${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, file), fullPage: true });
  return file;
}

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function check(
  page: Page,
  label: string,
  urlPath: string,
  testFn: (page: Page) => Promise<{ note: string; status?: "PASS" | "FAIL" | "WARN" }>
): Promise<CheckResult> {
  const consoleErrors: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onError = (err: Error) => consoleErrors.push(err.message);

  page.on("console", onConsole);
  page.on("pageerror", onError);

  try {
    await page.goto(BASE + urlPath, { waitUntil: "networkidle", timeout: 15000 });
    const { note, status } = await testFn(page);
    const screenshotName = label.replace(/\s+/g, "-").toLowerCase();
    const screenshot = await shot(page, screenshotName);
    page.off("console", onConsole);
    page.off("pageerror", onError);
    return { path: urlPath, label, status: status ?? "PASS", note, screenshot, consoleErrors };
  } catch (err) {
    const screenshotName = label.replace(/\s+/g, "-").toLowerCase() + "-error";
    let screenshot: string | undefined;
    try { screenshot = await shot(page, screenshotName); } catch {}
    page.off("console", onConsole);
    page.off("pageerror", onError);
    return {
      path: urlPath,
      label,
      status: "FAIL",
      note: err instanceof Error ? err.message : String(err),
      screenshot,
      consoleErrors,
    };
  }
}

async function run() {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const results: CheckResult[] = [];

  // ── 1. 首页 / ──────────────────────────────────────────────────────────
  results.push(
    await check(page, "首页 Landing", "/", async (p) => {
      const finalUrl = p.url();
      const redirectedTo = finalUrl.replace(BASE, "");
      if (redirectedTo.startsWith("/zh/") || redirectedTo.startsWith("/en/")) {
        return { note: `自动跳转 locale → ${redirectedTo}` };
      }
      return { note: `停在 ${redirectedTo}`, status: "WARN" };
    })
  );

  // ── 2. 登录页 ──────────────────────────────────────────────────────────
  results.push(
    await check(page, "登录页", "/zh/auth/login", async (p) => {
      const emailInput = await p.locator('input[type="email"]').first();
      const passInput = await p.locator('input[type="password"]').first();
      if (!(await emailInput.isVisible()) || !(await passInput.isVisible())) {
        return { note: "缺少 email / password 输入框", status: "FAIL" };
      }
      // 空提交
      await p.locator('button[type="submit"]').first().click();
      await p.waitForTimeout(800);
      return { note: "空提交不崩溃，表单可见" };
    })
  );

  // ── 3. 注册页 ──────────────────────────────────────────────────────────
  results.push(
    await check(page, "注册页", "/zh/auth/sign-up", async (p) => {
      const emailInput = await p.locator('input[type="email"]').first();
      if (!(await emailInput.isVisible())) {
        return { note: "注册表单不可见", status: "FAIL" };
      }
      await p.locator('button[type="submit"]').first().click();
      await p.waitForTimeout(800);
      return { note: "空提交不崩溃，表单可见" };
    })
  );

  // ── 4. 受保护首页 → 未登录应 redirect ────────────────────────────────
  results.push(
    await check(page, "保护路由未登录", "/zh/protected", async (p) => {
      const url = p.url();
      if (url.includes("/auth/login") || url.includes("/auth/sign-up")) {
        return { note: `正确 redirect → ${url.replace(BASE, "")}` };
      }
      return { note: `未 redirect，停在 ${url.replace(BASE, "")}`, status: "WARN" };
    })
  );

  // ── 5. Onboarding 页 ──────────────────────────────────────────────────
  results.push(
    await check(page, "Onboarding 入口", "/zh/onboarding", async (p) => {
      const url = p.url();
      // 未登录可能被 redirect
      if (url.includes("/auth/")) {
        return { note: `未登录 redirect → ${url.replace(BASE, "")}`, status: "WARN" };
      }
      const micBtn = await p.locator("button").filter({ hasText: /开始体验|准备场景/ }).first();
      if (await micBtn.isVisible()) {
        return { note: "onboarding screen 0 加载成功，按钮可见" };
      }
      return { note: "页面加载但按钮不可见", status: "WARN" };
    })
  );

  // ── 6. Learn index → redirect 检查 ───────────────────────────────────
  results.push(
    await check(page, "Learn index redirect", "/zh/protected/learn", async (p) => {
      const url = p.url();
      if (url.includes("/auth/")) {
        return { note: `未登录 redirect → ${url.replace(BASE, "")}` };
      }
      if (url.includes("/protected/learn/")) {
        return { note: `redirect 到具体课程 → ${url.replace(BASE, "")}` };
      }
      return { note: `停在 ${url.replace(BASE, "")}`, status: "WARN" };
    })
  );

  // ── 7. 底部导航结构（通过 login 页检测 nav 是否泄漏） ─────────────────
  results.push(
    await check(page, "底部导航不泄漏至登录页", "/zh/auth/login", async (p) => {
      const nav = await p.locator("nav").count();
      if (nav > 0) {
        return { note: `登录页存在 ${nav} 个 nav 元素（底部导航泄漏？）`, status: "WARN" };
      }
      return { note: "登录页无底部导航" };
    })
  );

  // ── 8. Review 页 → 未登录 ─────────────────────────────────────────────
  results.push(
    await check(page, "Review 未登录 redirect", "/zh/protected/review", async (p) => {
      const url = p.url();
      if (url.includes("/auth/")) {
        return { note: `正确 redirect → ${url.replace(BASE, "")}` };
      }
      return { note: `未 redirect，停在 ${url.replace(BASE, "")}`, status: "WARN" };
    })
  );

  // ── 9. Map 页 → 未登录 ────────────────────────────────────────────────
  results.push(
    await check(page, "Map 未登录 redirect", "/zh/protected/map", async (p) => {
      const url = p.url();
      if (url.includes("/auth/")) {
        return { note: `正确 redirect → ${url.replace(BASE, "")}` };
      }
      return { note: `未 redirect，停在 ${url.replace(BASE, "")}`, status: "WARN" };
    })
  );

  // ── 10. /en/ locale 路由 ──────────────────────────────────────────────
  results.push(
    await check(page, "EN locale 首页", "/en/", async (p) => {
      const url = p.url();
      if (!url.includes("/en/") && !url.startsWith(BASE + "/en")) {
        return { note: `locale /en/ 跳到了 ${url.replace(BASE, "")}（locale 丢失？）`, status: "WARN" };
      }
      return { note: `EN 路由正常 → ${url.replace(BASE, "")}` };
    })
  );

  await browser.close();

  // ── 生成 Markdown 报告 ────────────────────────────────────────────────
  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const fail = results.filter((r) => r.status === "FAIL").length;

  const statusIcon = (s: string) =>
    s === "PASS" ? "✅" : s === "WARN" ? "⚠️" : "❌";

  const rows = results
    .map(
      (r) =>
        `| ${statusIcon(r.status)} | ${r.label} | \`${r.path}\` | ${r.note}${r.consoleErrors.length ? ` · **console errors: ${r.consoleErrors.length}**` : ""} |`
    )
    .join("\n");

  const details = results
    .filter((r) => r.consoleErrors.length > 0)
    .map(
      (r) =>
        `### ${r.label}\n${r.consoleErrors.map((e) => `- \`${e.slice(0, 200)}\``).join("\n")}`
    )
    .join("\n\n");

  const md = `# TalkFlow UI Smoke Test — Playwright 报告

生成时间：${new Date().toISOString()}
测试环境：${BASE}（Mobile 390×844）

## 汇总

| 状态 | 数量 |
|------|------|
| ✅ PASS | ${pass} |
| ⚠️ WARN | ${warn} |
| ❌ FAIL | ${fail} |

## 逐项结果

| 状态 | 页面 | 路径 | 备注 |
|------|------|------|------|
${rows}

${details ? `## Console 错误详情\n\n${details}` : ""}

## 截图目录

\`${SCREENSHOT_DIR}\`
`;

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`\n报告写入：${REPORT_PATH}`);
  console.log(`PASS:${pass}  WARN:${warn}  FAIL:${fail}`);
}

run().catch((err) => {
  console.error("smoke test failed:", err);
  process.exit(1);
});
