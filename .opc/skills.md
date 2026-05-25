# TalkFlow — 技能索引

> 结构镜像 OPC-X 10 部门。专项知识挂在对应部门下。
> 发现通用模式 → 回流到 opc-x 对应 orchestrator（运行 /talkflow 回流检查）。
> 新增专项知识 → 在对应部门区块末尾追加。

---

## O01·战略 [触发：目标/OKR/战略/规划/商业模式/竞争/转型/定位]
→ 回流：opc-x/orchestrators/O01-strategy/

**市场定位**：AI口语 × 结构化内容 × SRS = 高性价比系统训练（Cambly的1/100价格）

**竞品地图**
| 竞品 | 优势 | 劣势 |
|---|---|---|
| Cambly | 真人沉浸 | ¥100+/小时，难坚持 |
| 多邻国 | 免费习惯养成 | 口语弱，碎片化 |
| italki | 灵活 | 门槛高，价格不稳 |
| **TalkFlow** | AI+结构+SRS | 知名度低 |

**当前阶段**：MVP完成，PMF验证中。北极星：10万用户突破口语瓶颈。

---

## O02·调研 [触发：调研/竞品/用户洞察/趋势/访谈/画像/JTBD]
→ 回流：opc-x/orchestrators/O02-research/

**核心用户画像**：22-35岁，白领/考研党，哑巴英语，考试/职场驱动

**行为规律**
- 最佳练习时长：15-20分钟/天
- 流失节点：Day3、Day7（新鲜感消退）
- 最强激励：可见进步（streak + 等级）

**痛点优先级**：① 不敢开口 ② 看不到进步 ③ 坚持不下去

---

## O03·产品 [触发：需求/PRD/功能/路线图/MVP/用户故事/验收]
→ 回流：opc-x/orchestrators/O03-product/

**核心路由**
| 路由 | 用途 |
|---|---|
| `/onboarding` | 口语测评（AI，调用 backend） |
| `/protected/learn/[book]/[lesson]` | 课程播放器 |
| `/protected/review` | SRS每日复习 |
| `/protected/stats` | 学习统计 |

**付费墙**：前3课免费 → 第3课完成时弹付费引导（刚尝到甜头）

**P0 功能缺口**：SRS队列未填充（`completeLesson()` bug）

---

## O04·工程 [触发：代码/架构/bug/重构/API/性能/安全/测试/CI]
→ 回流：opc-x/orchestrators/O04-engineering/

**架构**
```
frontend (Next.js 15) ──supabase-js──► Supabase DB
frontend              ──fetch────────► backend :4000 (Hono)
```

**P0 Bug — SRS未填充**
- 文件：`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`
- 问题：`completeLesson()` 完成后未写入 `review_schedule`
- 修复：查课程所有 `qa_pairs` → INSERT review_schedule（interval=1, ease=2.5, rep=0）

**SM-2算法**
```
quality≥3 → interval=(rep=1?1:rep=2?6:round(prev×ease)), rep++
quality<3 → interval=1, rep=0
ease += 0.1-(5-q)×(0.08+(5-q)×0.02), 最小1.3
```

**关键文件**
- `lib/supabase/server.ts` — Server Components用
- `lib/supabase/client.ts` — Client Components用
- `backend/src/routes/assessment.ts` — AI评估路由
- `shared/` — 前后端共享代码（@shared/* alias）

**Dev Bypass**：`.env.local` 设 `DEV_BYPASS_AUTH=true` 跳过JWT

---

## O05·内容 [触发：课程内容/文案/文档/Callan/qa_pair/教材]
→ 回流：opc-x/orchestrators/O05-content/

**教材结构**：12册 × ~16课 = 191课，CEFR A1→C2

**Callan→TalkFlow转换原则**
- 保留：Q&A结构、重复机制
- 去除：纯读写练习
- 增加：AI评分、录音回放
- 语调：命令式→对话式

**内容块类型**：vocabulary / qa_pair / note / exercise

**qa_pair格式**：`{ lesson_id, question, answer, cefr_level, order_index }`

---

## O06·营销 [触发：营销/渠道/增长/裂变/留存/发布/广告/推广]
→ 回流：opc-x/orchestrators/O06-marketing/

**冷启动路径**：10种子用户 → 微信群打卡 → 进步截图扩散 → 邀请裂变

**激励机制**：邀请好友双方得30天专业版 / 完成一册生成证书可晒

**种子用户来源**：创始人微信好友 / 考研群 / 小红书「英语焦虑」话题

**关键转化节点**：完成第3课后弹付费引导

---

## O07·运营 [触发：SOP/流程/客服/自动化/工具/用户引导/日程]
→ 回流：opc-x/orchestrators/O07-operations/

**用户生命周期运营节点**
- Day0：完成onboarding → 推送「第一课等你」
- Day3：防流失节点 → 个性化唤醒
- Day7：防流失节点 → 展示进步数据
- 7天未登录 → 召回推送

**客服核心问题**：SRS「学了没得复习」（P0 Bug导致）

---

## O08·数据 [触发：数据/指标/SQL/分析/报告/埋点/看板/留存]
→ 回流：opc-x/orchestrators/O08-data/

**核心指标目标（第1圈）**
| 指标 | 目标 |
|---|---|
| 激活率（注册→完成onboarding）| >60% |
| D1留存 | >40% |
| D7留存 | >20% |
| 课程完成率 | >70% |
| 付费转化 | >5% |

**数据源**
- `session_records` → 活跃天数/连续学习
- `qa_responses` → 准确率趋势
- `review_schedule` → SRS参与率（当前全空，Bug未修）

---

## O09·财务 [触发：定价/收入/财务/融资/CAC/LTV/现金流/Stripe]
→ 回流：opc-x/orchestrators/O09-finance/

**定价**
| 计划 | 价格 | 定位 |
|---|---|---|
| 免费 | ¥0 | 前3课体验 |
| 基础 | ¥168/年 | 个人学习 |
| 专业 | ¥228/年 | 全功能 |

**Stripe 状态**：checkout stub，未实现

**单位经济学**：目标 LTV/CAC > 3，年付用户流失率<30%

---

## O10·元认知 [触发：复盘/审计/回流/系统迭代/螺旋/反馈/opc-audit]
→ 回流：opc-x/orchestrators/O10-meta/

**螺旋推进检查清单**
- [ ] 本圈目标达成了吗？
- [ ] project-state.md 更新了吗？
- [ ] 有没有专项知识可以回流到 opc-x？
- [ ] 下一圈的核心目标是什么？

**回流判断标准**：其他项目也能用 → 回流 opc-x；只有TalkFlow用 → 留在此文件

---

## 新增专项知识

找到对应部门区块，在末尾追加。发现通用模式后通过 `/talkflow 回流检查` 确认是否推送到 opc-x。
