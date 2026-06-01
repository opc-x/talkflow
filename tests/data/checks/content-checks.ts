// 【可展开实现】术语-内容对应 checklist —— 验每个新词是否真的出现在本课问答里。
// 主流程在 ../lesson1.test.ts。
//
// 背景：新词列表的词，理应能在本课问答句里找到（学了就用上）。
//       找不到的叫「孤词」—— 大概率是挂错课/脏数据。

/** 把术语和问答都洗成「只剩小写字母和空格」，做宽松包含匹配（容忍标点/连字符差异）。 */
function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()
}

/** 取术语的匹配键：全称 + 括号前主干（Callan 标注如 what is (what's)） */
function termKeys(term: string): string[] {
  const full = clean(term)
  const head = clean(term.split("(")[0] ?? term)
  return [...new Set([full, head].filter((k) => k.length > 1))]
}

/**
 * 术语内容对应验证清单：
 *   1. 没有孤词（每个新词都能在问答里找到）
 * 失败时把孤词列出来。
 */
export function contentChecklist(terms: string[], qaText: string): Array<[string, unknown, boolean]> {
  const haystack = clean(qaText)
  const orphans = terms.filter((t) => {
    const keys = termKeys(t)
    if (keys.length === 0 || keys.every((k) => k.length <= 2)) return false
    return keys.every((key) => !haystack.includes(key))
  })

  return [
    [
      "无孤词（新词都在问答里出现）",
      orphans.length === 0 ? "全部命中" : `${orphans.length}个孤词：${orphans.join("、")}`,
      orphans.length === 0,
    ],
  ]
}
