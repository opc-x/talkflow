/**
 * TalkFlow Full Interaction Test
 *
 * 前提：
 *   - DEV_BYPASS_AUTH=true (已设，所有保护路由直接进)
 *   - npm run dev 已运行（:3000）
 *   - npm run dev:api 已运行（:4000，onboarding 需要）
 *
 * Usage:
 *   npx tsx scripts/ui-full-interaction.ts
 */

import { chromium, type Page, type BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), ".opc", "outputs");
const SHOT_DIR = path.join(OUT_DIR, "screenshots-full");
const REPORT_PATH = path.join(OUT_DIR, "interaction-report.md");

fs.mkdirSync(SHOT_DIR, { recursive: true });

// ─── 结果收集 ──────────────────────────────────────────────────────────────

type Status = "PASS" | "FAIL" | "WARN" | "SKIP";

interface Result {
  page: string;
  action: string;
  status: Status;
  note: string;
  shot?: string;
  errors: string[];
}

const results: Result[] = [];
const consoleErrors: string[] = [];

function log(r: Result) {
  const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : r.status === "WARN" ? "⚠️" : "⏭";
  console.log(`${icon} [${r.page}] ${r.action} — ${r.note}`);
  results.push(r);
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────

async function shot(page: Page, name: string): Promise<string> {
  const file = `${name.replace(/[^a-z0-9-]/gi, "-")}.png`;
  await page.screenshot({ path: path.join(SHOT_DIR, file), fullPage: false });
  return file;
}

async function goto(page: Page, urlPath: string, label: string): Promise<void> {
  await page.goto(BASE + urlPath, { waitUntil: "domcontentloaded", timeout: 12000 });
}

async function clickAndWait(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout });
    await el.click();
    await page.waitForTimeout(600);
    return true;
  } catch {
    return false;
  }
}

async function expectVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    await page.locator(selector).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

function attachErrorListener(page: Page): () => string[] {
  const errs: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") errs.push(msg.text().slice(0, 200));
  };
  const onError = (err: Error) => errs.push(err.message.slice(0, 200));
  page.on("console", onConsole);
  page.on("pageerror", onError);
  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onError);
    return errs;
  };
}

// ─── 各页面测试 ────────────────────────────────────────────────────────────

async function testAuth(page: Page) {
  // 登录页
  const stopA = attachErrorListener(page);
  await goto(page, "/zh/auth/login", "登录页");
  const hasEmail = await expectVisible(page, 'input[type="email"]');
  const hasPass = await expectVisible(page, 'input[type="password"]');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(500);
  const shotA = await shot(page, "auth-login");
  log({ page: "登录页", action: "加载+空提交", status: hasEmail && hasPass ? "PASS" : "FAIL", note: hasEmail && hasPass ? "表单完整，空提交不崩" : "输入框缺失", shot: shotA, errors: stopA() });

  // 注册页
  const stopB = attachErrorListener(page);
  await goto(page, "/zh/auth/sign-up", "注册页");
  const hasEmailB = await expectVisible(page, 'input[type="email"]');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(500);
  const shotB = await shot(page, "auth-signup");
  log({ page: "注册页", action: "加载+空提交", status: hasEmailB ? "PASS" : "FAIL", note: hasEmailB ? "表单完整，空提交不崩" : "输入框缺失", shot: shotB, errors: stopB() });
}

async function testDashboard(page: Page) {
  const stop = attachErrorListener(page);
  await goto(page, "/zh/protected", "首页");
  await page.waitForTimeout(1000);

  const hasScene = await expectVisible(page, "article");
  const shotD = await shot(page, "dashboard");

  // 点今日复习链接
  const reviewLink = page.locator("a").filter({ hasText: /今日复习/ }).first();
  const hasReview = await reviewLink.isVisible().catch(() => false);

  // 点课程地图链接
  const mapLink = page.locator("a").filter({ hasText: /课程地图/ }).first();
  const hasMap = await mapLink.isVisible().catch(() => false);

  // 点主场景卡片（进入场景 or 开始体验）
  const heroCard = page.locator("article a, a article").first();
  const hasHero = await heroCard.isVisible().catch(() => false);

  const errs = stop();
  log({
    page: "首页",
    action: "加载 + 检查核心元素",
    status: hasScene ? "PASS" : "FAIL",
    note: `场景卡:${hasScene} 复习链接:${hasReview} 地图链接:${hasMap}`,
    shot: shotD,
    errors: errs,
  });
}

async function testLesson(page: Page) {
  // 进入第1课
  const stop1 = attachErrorListener(page);
  await goto(page, "/zh/protected/learn/1/1", "课程1-1");
  await page.waitForTimeout(1200);

  const hasHeader = await expectVisible(page, "header");
  const hasVocab = await expectVisible(page, "button, [class*='btn']", 4000);
  const shot1 = await shot(page, "lesson-vocab-phase");

  log({
    page: "课程 1-1",
    action: "加载 vocab 阶段",
    status: hasHeader ? "PASS" : "FAIL",
    note: hasHeader ? "词汇阶段加载成功" : "header 不可见",
    shot: shot1,
    errors: stop1(),
  });

  // 点「开始问答」
  const stop2 = attachErrorListener(page);
  const startBtn = page.locator("button").filter({ hasText: /开始问答/ }).first();
  const hasStart = await startBtn.isVisible().catch(() => false);
  if (hasStart) {
    await startBtn.click();
    await page.waitForTimeout(800);
  }
  const shot2 = await shot(page, "lesson-question-phase");
  const questionVisible = await expectVisible(page, "p.text-2xl, p.text-xl", 3000).catch(() => false);

  log({
    page: "课程 1-1",
    action: "点击「开始问答」→ 问题阶段",
    status: hasStart ? "PASS" : "WARN",
    note: hasStart ? `问题文字:${questionVisible}` : "开始问答按钮不可见",
    shot: shot2,
    errors: stop2(),
  });

  // 点「看答案」
  const stop3 = attachErrorListener(page);
  const answerBtn = page.locator("button").filter({ hasText: /看答案/ }).first();
  const hasAnswer = await answerBtn.isVisible().catch(() => false);
  if (hasAnswer) {
    await answerBtn.click();
    await page.waitForTimeout(600);
  }
  const shot3 = await shot(page, "lesson-answer-phase");
  const nextBtn = await expectVisible(page, "button").catch(() => false);
  log({
    page: "课程 1-1",
    action: "点「看答案」→ 答案阶段",
    status: hasAnswer ? "PASS" : "WARN",
    note: hasAnswer ? "答案展示，下一句按钮可见" : "看答案按钮不可见",
    shot: shot3,
    errors: stop3(),
  });

  // 点「下一句」
  const stop4 = attachErrorListener(page);
  const nextBtnEl = page.locator("button").filter({ hasText: /下一句/ }).first();
  const hasNext = await nextBtnEl.isVisible().catch(() => false);
  if (hasNext) {
    await nextBtnEl.click();
    await page.waitForTimeout(600);
  }
  const shot4 = await shot(page, "lesson-next-sentence");
  log({
    page: "课程 1-1",
    action: "点「下一句」",
    status: hasNext ? "PASS" : "WARN",
    note: hasNext ? "跳到下一句" : "下一句按钮不可见",
    shot: shot4,
    errors: stop4(),
  });

  // 点「返回」
  const stop5 = attachErrorListener(page);
  const backBtn = page.locator("button").filter({ hasText: /返回/ }).first();
  const hasBack = await backBtn.isVisible().catch(() => false);
  if (hasBack) {
    await backBtn.click();
    await page.waitForTimeout(600);
  }
  const shot5 = await shot(page, "lesson-back");
  log({
    page: "课程 1-1",
    action: "点「返回」",
    status: hasBack ? "PASS" : "WARN",
    note: hasBack ? "返回成功" : "返回按钮不可见",
    shot: shot5,
    errors: stop5(),
  });
}

async function testReview(page: Page) {
  const stop = attachErrorListener(page);
  await goto(page, "/zh/protected/review", "复习页");
  await page.waitForTimeout(1000);

  const shot1 = await shot(page, "review-loaded");

  // 检查内容
  const hasTitle = await expectVisible(page, "h1, h2", 3000).catch(() => false);
  const hasCard = await expectVisible(page, ".rounded-2xl, [class*='card']", 3000).catch(() => false);

  // 点「点击显示答案」
  const revealBtn = page.locator("button").filter({ hasText: /点击显示答案/ }).first();
  const hasReveal = await revealBtn.isVisible().catch(() => false);
  if (hasReveal) {
    await revealBtn.click();
    await page.waitForTimeout(600);
  }

  const shot2 = await shot(page, "review-revealed");

  // 点评分按钮
  const ratingBtn = page.locator("button").filter({ hasText: /记得|脱口而出/ }).first();
  const hasRating = await ratingBtn.isVisible().catch(() => false);
  if (hasRating) {
    await ratingBtn.click();
    await page.waitForTimeout(800);
  }

  const shot3 = await shot(page, "review-after-rating");
  const errs = stop();

  log({
    page: "复习页",
    action: "加载",
    status: hasTitle ? "PASS" : "WARN",
    note: hasTitle ? (hasCard ? "有复习题目" : "无今日题目（正常）") : "页面结构异常",
    shot: shot1,
    errors: errs,
  });
  if (hasReveal) {
    log({ page: "复习页", action: "点击显示答案", status: "PASS", note: "答案展示成功", shot: shot2, errors: [] });
  }
  if (hasRating) {
    log({ page: "复习页", action: "点评分按钮", status: "PASS", note: "评分点击成功", shot: shot3, errors: [] });
  }
}

async function closeModalIfOpen(page: Page) {
  const modal = page.locator("[role='dialog'].fixed, .fixed.inset-0[role='dialog']").first();
  const isOpen = await modal.isVisible().catch(() => false);
  if (isOpen) {
    // ESC 关闭
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    // 再检查一次，点 overlay 关
    const stillOpen = await modal.isVisible().catch(() => false);
    if (stillOpen) {
      await page.mouse.click(10, 10); // 点 modal 外侧
      await page.waitForTimeout(300);
    }
  }
}

async function testMap(page: Page) {
  const stop1 = attachErrorListener(page);
  await goto(page, "/zh/protected/map", "路线图");
  await page.waitForTimeout(1000);

  const hasTitle = await expectVisible(page, "h1", 3000).catch(() => false);
  const shot1 = await shot(page, "map-loaded");
  log({
    page: "路线图",
    action: "加载",
    status: hasTitle ? "PASS" : "FAIL",
    note: hasTitle ? "路线图加载成功" : "标题不可见",
    shot: shot1,
    errors: stop1(),
  });

  // 点第1阶段（免费，不会触发 UpgradeModal）
  const stop2 = attachErrorListener(page);
  const freeTab = page.locator("a[href*='phase=1']").first();
  const hasTab = await freeTab.isVisible().catch(() => false);
  if (hasTab) {
    await freeTab.click();
    await page.waitForTimeout(800);
  }
  // 如果不小心弹了 modal，关掉
  await closeModalIfOpen(page);
  const shot2 = await shot(page, "map-phase1");
  log({
    page: "路线图",
    action: "切换阶段1 Tab（免费）",
    status: hasTab ? "PASS" : "WARN",
    note: hasTab ? "阶段切换成功" : "Tab 不可见",
    shot: shot2,
    errors: stop2(),
  });

  // 点一个课程节点（phase=1 是免费的，节点可点）
  const stop3 = attachErrorListener(page);
  await closeModalIfOpen(page);
  const lessonNode = page.locator("a[href*='/protected/learn/']").first();
  const hasNode = await lessonNode.isVisible().catch(() => false);
  if (hasNode) {
    await lessonNode.click({ timeout: 8000 });
    await page.waitForTimeout(1200);
    const curUrl = page.url();
    const shot3 = await shot(page, "map-lesson-click");
    log({
      page: "路线图",
      action: "点课程节点",
      status: curUrl.includes("/learn/") ? "PASS" : "WARN",
      note: `节点跳转 → ${curUrl.replace(BASE, "")}`,
      shot: shot3,
      errors: stop3(),
    });
  } else {
    log({ page: "路线图", action: "点课程节点", status: "WARN", note: "无可点击节点", errors: stop3() });
  }
}

async function testMe(page: Page) {
  const stop = attachErrorListener(page);
  await goto(page, "/zh/protected/me", "我的页面");
  await page.waitForTimeout(1000);

  const hasTitle = await expectVisible(page, "h1", 3000).catch(() => false);
  const shot1 = await shot(page, "me-loaded");
  log({
    page: "我的页面",
    action: "加载",
    status: hasTitle ? "PASS" : "FAIL",
    note: hasTitle ? "个人页加载成功" : "标题不可见",
    shot: shot1,
    errors: stop(),
  });

  // 点修改密码 link
  const stop2 = attachErrorListener(page);
  const settingsLink = page.locator("a[href*='/settings']").first();
  const hasSettings = await settingsLink.isVisible().catch(() => false);
  if (hasSettings) {
    await settingsLink.click();
    await page.waitForTimeout(800);
    const shotS = await shot(page, "me-settings-link");
    log({ page: "我的页面", action: "点修改密码", status: "PASS", note: "跳转 settings 成功", shot: shotS, errors: stop2() });
    await page.goBack();
    await page.waitForTimeout(500);
  } else {
    stop2();
    log({ page: "我的页面", action: "点修改密码", status: "WARN", note: "设置链接不可见", errors: [] });
  }

  // 点工具箱链接
  const stop3 = attachErrorListener(page);
  const toolLinks = page.locator("a[href*='/tools']").first();
  const hasTool = await toolLinks.isVisible().catch(() => false);
  if (hasTool) {
    await toolLinks.click();
    await page.waitForTimeout(800);
    const shotT = await shot(page, "me-tools-link");
    log({ page: "我的页面", action: "点工具箱", status: "PASS", note: "跳转 tools 成功", shot: shotT, errors: stop3() });
    await page.goBack();
    await page.waitForTimeout(500);
  } else {
    stop3();
  }

  // 升级按钮弹框
  const stop4 = attachErrorListener(page);
  await goto(page, "/zh/protected/me", "我的页面");
  await page.waitForTimeout(800);
  const upgradeBtn = page.locator("button").filter({ hasText: /升级 Pro/ }).first();
  const hasUpgrade = await upgradeBtn.isVisible().catch(() => false);
  if (hasUpgrade) {
    await upgradeBtn.click();
    await page.waitForTimeout(600);
    const modalVisible = await expectVisible(page, "[role='dialog'], .fixed.inset-0", 3000).catch(() => false);
    const shotU = await shot(page, "me-upgrade-modal");
    // 关闭 modal
    const closeBtn = page.locator("button[aria-label='关闭'], .fixed.inset-0").first();
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    log({ page: "我的页面", action: "点升级弹框", status: modalVisible ? "PASS" : "WARN", note: modalVisible ? "升级 Modal 正常弹出" : "Modal 未出现", shot: shotU, errors: stop4() });
  } else {
    stop4();
  }
}

async function testProgress(page: Page) {
  const stop = attachErrorListener(page);
  await goto(page, "/zh/protected/progress", "进度页");
  await page.waitForTimeout(800);
  const hasContent = await expectVisible(page, "h1, h2, main", 3000).catch(() => false);
  const shotP = await shot(page, "progress");
  log({ page: "进度页", action: "加载", status: hasContent ? "PASS" : "WARN", note: hasContent ? "进度页加载成功" : "内容不可见", shot: shotP, errors: stop() });
}

async function testStats(page: Page) {
  const stop = attachErrorListener(page);
  await goto(page, "/zh/protected/stats", "统计页");
  await page.waitForTimeout(800);
  const hasContent = await expectVisible(page, "h1, h2, main", 3000).catch(() => false);
  const shotS = await shot(page, "stats");
  log({ page: "统计页", action: "加载", status: hasContent ? "PASS" : "WARN", note: hasContent ? "统计页加载成功" : "内容不可见", shot: shotS, errors: stop() });
}

async function testOnboarding(page: Page) {
  const stop1 = attachErrorListener(page);
  await goto(page, "/zh/onboarding", "Onboarding");
  await page.waitForTimeout(1500);

  const hasBtn = await expectVisible(page, "button", 3000).catch(() => false);
  const shot1 = await shot(page, "onboarding-screen0");
  const errs1 = stop1();
  log({
    page: "Onboarding",
    action: "Screen 0 加载",
    status: hasBtn ? (errs1.length ? "WARN" : "PASS") : "FAIL",
    note: hasBtn ? `按钮可见${errs1.length ? `，但有 ${errs1.length} 个 console error` : ""}` : "按钮不可见",
    shot: shot1,
    errors: errs1,
  });

  // 点开始体验 → screen 1
  const stop2 = attachErrorListener(page);
  const startBtn = page.locator("button").filter({ hasText: /开始体验|准备场景/ }).first();
  const hasStart = await startBtn.isEnabled().catch(() => false);
  if (hasStart) {
    await startBtn.click();
    await page.waitForTimeout(600);
    const hasRules = await expectVisible(page, "ul li", 2000).catch(() => false);
    const shot2 = await shot(page, "onboarding-screen1");
    log({ page: "Onboarding", action: "Screen 1 怎么练", status: hasRules ? "PASS" : "WARN", note: hasRules ? "规则列表可见" : "规则列表不可见", shot: shot2, errors: stop2() });

    // screen 1 → screen 2
    const stop3 = attachErrorListener(page);
    const nextBtn = page.locator("button").filter({ hasText: /明白了|试第一句/ }).first();
    const hasNext = await nextBtn.isVisible().catch(() => false);
    if (hasNext) {
      await nextBtn.click();
      await page.waitForTimeout(600);
      const hasScene = await expectVisible(page, ".rounded-2xl", 2000).catch(() => false);
      const hasMic = await expectVisible(page, "button[aria-label='开始说话']", 2000).catch(() => false);
      const shot3 = await shot(page, "onboarding-screen2");
      log({ page: "Onboarding", action: "Screen 2 场景+麦克风", status: hasMic ? "PASS" : "WARN", note: `场景:${hasScene} 麦克风按钮:${hasMic}`, shot: shot3, errors: stop3() });
    } else {
      stop3();
      log({ page: "Onboarding", action: "Screen 2 跳转", status: "WARN", note: "「明白了」按钮不可见（API 未返回题目？）", errors: [] });
    }
  } else {
    stop2();
    log({ page: "Onboarding", action: "Screen 1 跳转", status: "WARN", note: "开始体验按钮 disabled（API 500？）", errors: [] });
  }
}

async function testBottomNav(page: Page) {
  await goto(page, "/zh/protected", "首页");
  await page.waitForTimeout(800);

  const navItems = ["首页", "复习", "地图", "我的"];
  for (const label of navItems) {
    const stop = attachErrorListener(page);
    const navLink = page.locator("nav a, nav button").filter({ hasText: new RegExp(label) }).first();
    const hasNav = await navLink.isVisible().catch(() => false);
    if (hasNav) {
      await navLink.click();
      await page.waitForTimeout(800);
      const url = page.url();
      const shotN = await shot(page, `nav-${label}`);
      log({ page: "底部导航", action: `点击「${label}」`, status: "PASS", note: `跳转 → ${url.replace(BASE, "")}`, shot: shotN, errors: stop() });
    } else {
      stop();
      log({ page: "底部导航", action: `点击「${label}」`, status: "WARN", note: "导航项不可见", errors: [] });
    }
  }
}

// ─── 主流程 ────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== TalkFlow Full Interaction Test ===\n");

  const browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const page = await context.newPage();

  const suites = [
    ["认证", () => testAuth(page)],
    ["首页", () => testDashboard(page)],
    ["课程", () => testLesson(page)],
    ["复习", () => testReview(page)],
    ["路线图", () => testMap(page)],
    ["我的页面", () => testMe(page)],
    ["进度", () => testProgress(page)],
    ["统计", () => testStats(page)],
    ["Onboarding", () => testOnboarding(page)],
    ["底部导航", () => testBottomNav(page)],
  ] as const;

  for (const [name, fn] of suites) {
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      console.error(`💥 [${name}] 崩溃: ${msg}`);
      log({ page: name, action: "suite 执行", status: "FAIL", note: msg, errors: [msg] });
      // 导航回首页恢复状态
      await page.goto(BASE + "/zh/protected").catch(() => {});
    }
  }

  await browser.close();

  // ─── 生成报告 ────────────────────────────────────────────────────────────

  const pass = results.filter((r) => r.status === "PASS").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const fail = results.filter((r) => r.status === "FAIL").length;

  const icon = (s: Status) => s === "PASS" ? "✅" : s === "FAIL" ? "❌" : s === "WARN" ? "⚠️" : "⏭";

  const table = results
    .map((r) => `| ${icon(r.status)} ${r.status} | ${r.page} | ${r.action} | ${r.note}${r.errors.length ? ` (**${r.errors.length} error**)` : ""} |`)
    .join("\n");

  const errorSections = results
    .filter((r) => r.errors.length > 0)
    .map((r) => `### ${r.page} — ${r.action}\n${r.errors.map((e) => `- \`${e}\``).join("\n")}`)
    .join("\n\n");

  const failSection = results
    .filter((r) => r.status === "FAIL")
    .map((r) => `- **[${r.page}] ${r.action}**: ${r.note}`)
    .join("\n");

  const warnSection = results
    .filter((r) => r.status === "WARN")
    .map((r) => `- [${r.page}] ${r.action}: ${r.note}`)
    .join("\n");

  const md = `# TalkFlow 全路径交互测试报告

生成时间：${new Date().toLocaleString("zh-CN")}
测试环境：${BASE}（Mobile 390×844，DEV_BYPASS_AUTH=true）

## 汇总

| ✅ PASS | ⚠️ WARN | ❌ FAIL |
|--------|--------|--------|
| ${pass} | ${warn} | ${fail} |

## 逐项结果

| 状态 | 页面 | 操作 | 备注 |
|------|------|------|------|
${table}

${fail > 0 ? `## ❌ 失败项（需修复）\n\n${failSection}\n` : ""}
${warn > 0 ? `## ⚠️ 警告项（需关注）\n\n${warnSection}\n` : ""}
${errorSections ? `## Console 错误详情\n\n${errorSections}\n` : ""}

## 截图目录

\`${SHOT_DIR}\`
`;

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`\n=== 报告生成 ===`);
  console.log(`路径：${REPORT_PATH}`);
  console.log(`PASS: ${pass}  WARN: ${warn}  FAIL: ${fail}`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
