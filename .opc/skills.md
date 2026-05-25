# TalkFlow — 技能索引

> 任务开始前匹配最相关的技能区域。触发词命中即激活对应知识。

---

## [SRS算法] 触发：复习/间隔重复/review/卡片/队列/schedule

**SM-2 算法核心**
```
新卡：interval=1, ease=2.5, rep=0
quality≥3 → interval=(rep=1?1 : rep=2?6 : round(prev×ease)), rep++
quality<3 → interval=1, rep=0 重来
ease += 0.1 - (5-q)×(0.08 + (5-q)×0.02)，最小1.3
next_review_at = now + interval days
```

**P0 Bug**：`completeLesson()` 未写 `review_schedule` → SRS永远空
- 文件：`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`
- 修复：课程完成后，查该课所有 `qa_pairs`，INSERT 初始 review_schedule（interval=1, ease=2.5, rep=0）

---

## [口语评估] 触发：发音/评分/录音/Whisper/GPT-4o/assessment/feedback

**技术链路**：录音 → POST /api/v1/assessment/evaluate → Whisper转录 → GPT-4o评分 → {score, transcript, feedback}

**评估维度**：发音准确性30% / 流利度25% / 内容准确性30% / 词汇15%

**好反馈原则**：先肯定 → 最多2个改进点 → 给示范句。100字以内，中文解释+英文示范。

**关键文件**：`backend/src/routes/assessment.ts` / `lib/api/client.ts`

---

## [用户研究] 触发：用户/画像/流失/留存/DAU/D7/streak/坚持

**目标用户**：22-35岁中国成年人，哑巴英语，怕出错，考试/职场驱动

**留存关键数字**

| 指标 | 目标 |
|---|---|
| 激活率（注册→完成onboarding）| >60% |
| D1留存 | >40% |
| D7留存 | >20% |
| 课程完成率 | >70% |
| 付费转化 | >5% |

**流失节点**：Day3/Day7。每课≤15分钟。进步可视化 > 功能堆砌。

---

## [课程内容] 触发：课程/内容/Callan/qa_pair/content_block/难度/CEFR

**每课结构**：导入30s → 示范听1min → 跟读 → Q&A对话 → 完成确认

**Callan→TalkFlow**：保留Q&A结构+重复机制，去掉纯读写，加AI评分。命令式→对话式。

**难度爬坡**：A1单词短语 → A2简单句 → B1连接句 → B2抽象话题 → C1+观点辩论

**内容块类型**：vocabulary / qa_pair / note / exercise

---

## [AI反馈] 触发：prompt/反馈质量/feedback优化/GPT/评语

**坏→好对比**
- ❌"发音不准" → ✅"cat的/æ/偏长，试试：cat, hat, bat"
- ❌列5个问题 → ✅只说最重要的1-2个

**Prompt设计**：扮演有耐心的英语外教，学生是中国成年人，反馈100字内，先肯定→改进→示范句

---

## [市场定价] 触发：定价/竞品/市场/价格/付费/订阅/Stripe

**定价方案**

| 计划 | 价格 | 内容 |
|---|---|---|
| 免费 | ¥0 | 前3课+基础评估 |
| 基础 | ¥168/年 | 全191课+SRS |
| 专业 | ¥228/年 | 全功能+优先支持 |

**锚点**：Cambly ¥100+/小时 vs TalkFlow ¥168/年 = 极高性价比

**竞品**：Cambly（贵/真人）/ 多邻国（免费/口语弱）/ italki（门槛高）

**转化时机**：完成第3课后弹付费引导

---

## [社区增长] 触发：社区/裂变/冷启动/种子用户/推广/分享

**冷启动路径**：10个种子用户 → 微信群打卡 → 进步截图扩散 → 邀请好友裂变 → 博主合作

**激励机制**：每日打卡badge / 邀请好友双方得30天专业版 / 完成一册生成证书

**种子用户来源**：创始人微信好友 / 考研群 / 小红书"英语焦虑"话题

---

## [内容流水线] 触发：seed/入库/Callan原材料/内容生产/SOP

**转换流程**：Callan PDF → 解析结构 → 清洗 → 转换格式 → AI增强 → seed入库 → 人工抽查10%

**qa_pair格式**：`{ lesson_id, question, answer, cefr_level, order_index }`

**质量标准**：答案1-3句，必须能录音评估，同词汇5课内重复出现

**当前状态**：191课全部入库 ✅，发音音频TTS待补充

---

## 新增技能

在本文件末尾追加新的 `## [技能名] 触发：关键词` 区块即可，无需新建文件。
