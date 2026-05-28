## 调研报告

### 功能对比

| 模块 | italki | TalkFlow | 差距判断 |
|------|--------|----------|----------|
| 核心形态 | 真人外教撮合市场（20,000+ 教师 / 150+ 语言） | AI 口语陪练 + 结构化课程（191 课 / CEFR A1→C2） | 赛道不同：真人 vs AI+课程 |
| 1-on-1 课 | Professional Teacher / Community Tutor；30/45/60/90 分钟；Instant Lesson | 课内 Q&A 跟读 + Whisper+GPT 实时评分 | **缺**：真人对话与口音多样性 |
| 课程体系 | 教师自定教材，无平台统一路径 | Callan 素材蒸馏的 book/lesson/content_blocks | **优**：路径清晰、可预测进度 |
| 复习 | 教师布置作业；italki Plus AI 笔记/测验 | SRS `review_schedule`（课毕入队，实现中） | **优**：间隔重复；**缺**：人改作业深度 |
| 社区 | 语言交换、写作批改、论坛、Podcast/Quiz | 无社区层 | **缺** |
| 小班 | Group Class（教师带班） | 无 | **缺** |
| 测评 | 免费 Language Assessment；试听课筛选教师 | Speak-First 入学测评（后端 AI） | 各有侧重 |
| 视频 | italki Classroom / Zoom / Skype | 浏览器录音，无三方教室 | **优**：轻量；**缺**：真人临场 |
| 考试/商务 | 教师标签：IELTS/商务/语法等 | 阶段标签（CEFR stage） | **缺**：真人考官型辅导 |
| 定价体验 | 按次买 Credits，无必修月费 | `free/basic/pro` 订阅（Stripe 规划中） | italki 入门单价低但频次成本高 |

**italki 有、TalkFlow 无：** 真人母语对话、150+ 语言、Group Class、语言交换社区、Instant Lesson、试听课换师。  
**TalkFlow 有、italki 无：** 7×24 秒开练、统一课程螺旋、AI 即时反馈、低预约摩擦、中文产品壳（`/zh`）。

---

### 用户口碑

| 渠道 | 评分 | 样本量 |
|------|------|--------|
| App Store | **4.8/5** | ~9.2K 条 |
| Google Play | **4.6/5** | ~18.1K 条 |
| Trustpilot | **4.1/5** | ~14.4K 条 |

**典型好评（原话）**
- App Store：「*Italki is wonderful. There are so many options… I found my perfect teacher after about five or six trial lessons*」
- Google Play：「*the platform itself is amazing*」（同时批评 App 体验）
- Trustpilot：「*10/10 Experience 6/10 Interface… iTalki follows through on what they advertise—connecting language learners*」
- 中文长评（250+ 课时用户）：「*以龟在 italki 两年多的时间可以到这样，我觉得是比从小到大学英文还不会讲有效率多了*」— [thisisabook.net](https://www.thisisabook.net/archives/1610)
- PTT/Dcard 归纳：「*italki 最棒的就是 Community Tutor！…一小时才台币 250 元…比喝星巴克还划算*」

**典型差评（原话）**
- Google Play：「*it's buggy and not intuitive… reschedule… didn't go through on my teacher's end*」
- Google Play：「*the platform now kills the lesson when the time ends, which is very frustrating*」
- Google Play：「*No way to filter out by tutors in my region… list repeats after a few scrolls*」
- italki 社区帖：「*iTalki classroom was not working… I will not be compensated because the tech department doesn't have time to investigate*」
- Trustpilot：「*Hidden costs of processing fees that don't show until after you have chosen the class*」
- 中文：「*不能匿名留言，大多数人都给老师留下很好的评价，结果就无法从留言找到参考值*」；「*账号闲置 12 个月点数会失效*」

**口碑结论**

| 亮点 | 吐槽 |
|------|------|
| 师资多、单价弹性、无绑约 | App/网站 Bug、教室断线 |
| 试听课低成本换师 | 手续费/点数过期/退款难 |
| 真人口语见效快（中高活跃用户） | 筛师成本高、易流于闲聊 |

---

### 商业模型

**定价（学生端，2026 公开信息）**

| 项目 | 价格 |
|------|------|
| Community Tutor | **$4–20/课时** |
| Professional Teacher | **$10–40+/课时** |
| Trial Lesson | 正价 **30–50% off**（约 $3–10） |
| 课时长度 | 30 / 45 / 60 / 90 分钟 |
| italki Plus（可选） | **$5.99/月** 或 **$59.99/年**（$4.99/月） |
| 支付 | 先购 **italki Credits（USD）**；第三方支付 **Processing Fee**（结账页展示） |

**平台抽佣（教师端，官方 Help Center）**

| 课型 | 佣金 |
|------|------|
| Trial & Instant（trial） | **0%** |
| Single Lesson | **21%** |
| 5 课包 | **19%** |
| 10 课包 | **17%** |
| 15/20 课包 | **15%** |
| Group Class | **30%** |

来源：[How does italki charge a commission](https://support.italki.com/hc/en-us/articles/206352068-How-does-italki-charge-a-commission)

**转化漏斗（推测）**

```
免费注册 → 浏览教师/社区 → 购 Credits（+手续费）
    → Trial（低门槛）→ 绑定单教师 / 买课包
    → 高频复购 → italki Plus / 推荐返利（$10+$5）
    → B2B 企业课（定制报价）
```

**规模与收入（公开数据，口径不一）**
- 用户：官网/Sumsub 称 **10M+** 注册学员；教师 **20,000–30,000+**
- 融资：PitchBook/Tracxn **$3.15M**（Series A 2016，之后无新轮公开记录）
- 收入估算：**$25.2M/年**（Bitscale）vs **$341.6M**（Growjo）— 第三方差异大，仅作量级参考
- 模式本质：**双边市场抽佣 + Credits 沉淀 + Plus 订阅 + B2B**，非课时订阅制（对比 Preply 周课时包）

---

### 对 TalkFlow 的启示

1. **定位切割，不做 italki 平替**：对外强调「结构化每日开口 + AI 即时反馈」，真人外教留给 italki/Preply；可做「课前热身 / 课后 SRS」互补位，而非 1-on-1 市场正面竞争。
2. **学 italki 的「试课」逻辑，降低首次付费门槛**：免费 Speak-First 测评 + 首周每日练习额度，对标 italki Trial 的「先体验再绑师/绑费」心理，再导订阅。
3. **避坑清单写进产品/条款**：italki 差评集中在 App 稳定性、退款/点数、手续费透明度——TalkFlow 若做订阅，需明确取消/退款、无「闲置失效点数」，支付页一次性展示总价。

状态：DONE
