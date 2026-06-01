// 验证报告工具：给一组检查项，打印成带 ✅/❌ 的报告。
//   report     —— 有挂就抛错（红灯）。单个功能点用。
//   softReport —— 只打印 + 返回是否全过，不抛。串联多层时用（让每层都跑完）。
//   saveReport —— 把本次累积的所有报告段落写进 tests/reports/ 文件。

import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

type CheckItem = [label: string, actual: unknown, passed: boolean]

// 累积本次运行的 Markdown 报告段落，供 saveReport 落盘
const mdBuffer: string[] = []

// 控制台版：终端等宽框线，对齐好看
function consoleText(title: string, items: CheckItem[], allPass: boolean): string {
  const passCount = items.filter(([, , ok]) => ok).length
  return [
    "",
    `┌─ ${title}  [${passCount}/${items.length} 通过]`,
    ...items.map(([label, actual, ok]) =>
      `│  ${ok ? "✅" : "❌"} ${label.padEnd(24)} 实际：${String(actual)}`
    ),
    `└─ ${allPass ? "✅ 全部通过" : "❌ 有未通过项"}`,
  ].join("\n")
}

// 落盘版：Markdown 表格，VS Code 打开是真渲染
function markdownText(title: string, items: CheckItem[], allPass: boolean): string {
  const passCount = items.filter(([, , ok]) => ok).length
  return [
    `## ${title}  \`${passCount}/${items.length}\` ${allPass ? "✅" : "❌"}`,
    "",
    "| 状态 | 检查项 | 实际 |",
    "|:---:|---|---|",
    ...items.map(([label, actual, ok]) =>
      `| ${ok ? "✅" : "❌"} | ${label} | ${String(actual)} |`
    ),
    "",
  ].join("\n")
}

function printReport(title: string, items: CheckItem[]): boolean {
  const allPass = items.every(([, , ok]) => ok)
  console.log(consoleText(title, items, allPass))
  mdBuffer.push(markdownText(title, items, allPass))
  return allPass
}

/**
 * 把本次累积的所有报告段落写成 Markdown，存进 tests/reports/<name>.md
 * @param name 报告文件名前缀（如 "lesson1"）
 */
export function saveReport(name: string) {
  const dir = resolve(__dirname, "../reports")
  mkdirSync(dir, { recursive: true })
  const body = [`# ${name} 验证报告`, "", ...mdBuffer].join("\n")
  writeFileSync(resolve(dir, `${name}.md`), body, "utf8")
  mdBuffer.length = 0 // 写完清空，避免跨用例累积
  console.log(`\n📄 报告已写入 tests/reports/${name}.md`)
}

/** 打印报告，有未通过项就抛错（红灯）。 */
export function report(title: string, items: CheckItem[]) {
  if (!printReport(title, items)) {
    const failed = items.filter(([, , ok]) => !ok).map(([label]) => label)
    throw new Error(`${title} 未通过：${failed.join("、")}`)
  }
}

/** 打印报告，返回是否全过（不抛）。串联多层时用，让每层都跑完再统一裁决。 */
export function softReport(title: string, items: CheckItem[]): boolean {
  return printReport(title, items)
}
