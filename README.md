# TalkFlow

**可感知的口语提升 App**

只做一件事：**看图开口**。AI 即时纠错，15 分钟就有感觉。

---

## 产品定位

| | |
|--|--|
| **是什么** | 看图说话 + AI 即时纠错的英语口语练习工具 |
| **为谁做** | 任何想开口说几句英语、想看到真实效果的人 |
| **核心承诺** | 开口即有反馈（短期可感知）+ 学了不会忘（长期可感知）|
| **不做什么** | 语法填空、听力训练、阅读理解——一概不做 |

---

## 可感知 = 两个信号

| 信号 | 用户感受 | 机制 |
|------|---------|------|
| **短期** | 开口就知道对不对，15分钟有感觉 | AI 即时纠错（Whisper 转写 + GPT-4o 评分）|
| **长期** | 复习时记得住，进步看得见 | SRS 遗忘曲线复习队列 |

---

## 核心循环

看图 → 开口说 → AI 即时纠错 → SRS 复习

---

## 业务域优先级

**主业务域（唯一）**

```
口语练习循环
看图 → 开口说 → AI纠错 → 学完
产品存在的唯一理由
```

**从业务域**

| 优先级 | 域 | 职责 | 现状 |
|--------|-----|------|------|
| P1 | SRS 复习 | 遗忘曲线复习队列，学了不忘 | ✅ 完课写入 `review_schedule`（qa_pair 卡）；⚠️ terms 暂未入队 |
| P2 | 口语测评/定级 | Onboarding，CEFR 定起点 | ✅ 可用 |
| P3 | 学习进度 | 当前位置 + 完课记录 | ✅ 基本可用 |
| P4 | 订阅/支付 | 会员计划 + Stripe | ❌ Stub 未实现 |
| P5 | 身份认证 | Supabase Auth | ✅ 正常 |
| P5 | 课程内容 | 12册191课静态数据 | ✅ 已 seed，只读 |

---

## C4 L1 — 系统上下文

```mermaid
graph TB
    User(["👤 学习者"])

    subgraph TF["TalkFlow"]
        CORE["AI 英语口语练习\n看图→开口→纠错→SRS复习"]
    end

    OAI["⚡ OpenAI\nWhisper 语音转文字\nGPT-4o 评分纠错"]
    SB["🗄️ Supabase\n数据库 + 用户认证"]
    ST["💳 Stripe\n订阅支付"]

    User -->|练习口语| CORE
    CORE -->|音频评测 + AI纠错| OAI
    CORE -->|用户数据 + 课程内容| SB
    CORE -->|订阅支付| ST
```

---

## C4 L2 — 容器

```mermaid
graph TB
    User(["👤 学习者"])

    subgraph TF["TalkFlow"]
        FE["Next.js App\nApp Router + API Routes\n课程 / 复习 / 评测 / 统计"]
        API["/api/v1 Route Handlers\n薄 API 层\n鉴权 + 参数校验 + service 调用"]
        SVC["Server Services\nAI / 搜索 / Checkout 业务逻辑"]
    end

    SB[("Supabase\nPostgreSQL + Auth + RLS")]
    OAI["OpenAI API\nWhisper + GPT-4o"]
    STR["Stripe API"]

    User -->|HTTPS| FE
    FE -->|supabase-js 直连| SB
    FE -->|fetch /api/v1 + JWT| API
    API -->|调用| SVC
    SVC -->|JWT 验证 / 数据读写| SB
    SVC -->|音频 + 评测| OAI
    SVC -->|checkout| STR
```

---

## C4 L3 — 组件：Frontend

```mermaid
graph TB
    subgraph FE["Next.js Frontend"]
        OB["Onboarding Assessment\n开口测评 → AI 定位起点"]
        LP["Lesson Player\n课程播放 speak-first"]
        SRS["SRS Review Engine\n遗忘曲线复习队列"]
        MAP["Course Map\n12册 191课 地图"]
        STATS["Stats Dashboard\n学习统计 + 连续天数"]
        AUTH["Auth / Profile\nSupabase Auth"]
    end

    SB[("Supabase DB")]
    API["Next.js /api/v1"]

    OB -->|评测音频| API
    LP -->|完课写入| SB
    LP -->|音频评分| API
    LP -->|完课填充 review_schedule| SB
    SRS -->|读写 review_schedule| SB
    STATS -->|读 session_records| SB
    AUTH -->|session 管理| SB
```

---

## C4 L3 — 组件：API / Server

```mermaid
graph TB
    subgraph API["Next.js /api/v1"]
        RH["Route Handlers\n参数校验 + JSON 响应"]
        AM["API Auth Context\nJWT 验证 + userId 注入"]
        SS["Server Services\n业务逻辑"]
        AE["Assessment Evaluator\nWhisper 转写 + GPT-4o 评分"]
        AP["Placement Scorer\n多轮评测 → CEFR 定级"]
        CK["Checkout\nStripe stub（未完成）"]
    end

    FE["Client Components"]
    OAI["OpenAI API"]
    SB[("Supabase DB")]

    FE -->|Bearer JWT| RH
    RH --> AM
    AM --> SS
    SS --> AE & AP & CK
    AE -->|Whisper + GPT-4o| OAI
    AP -->|写入定级结果| SB
```

---

## DDD — 限界上下文地图

```mermaid
graph TB
    subgraph CORE["核心域 Core Domain"]
        LC["Learning Context\n课程学习·speak-first"]
        AC["Assessment Context\n口语测评·CEFR定级"]
    end

    subgraph SUPPORT["支撑域 Supporting Domain"]
        SR["SRS Context\n间隔复习·遗忘曲线"]
        CC["Content Context\n课程内容·只读"]
        PC["Progress Context\n学习进度·当前位置"]
    end

    subgraph GENERIC["通用域 Generic Domain"]
        SUB["Subscription Context\n订阅·plan管理"]
        ID["Identity Context\n用户身份·Auth"]
    end

    AC -->|AssessmentCompleted| PC
    LC -->|LessonCompleted| SR
    SR -->|ReviewAnswered| SR
    ID -->|UserRegistered| PC
    ID -->|UserRegistered| SUB
    SUB -->|SubscriptionChanged| LC
    CC -->|提供静态内容| LC
```

> ✅ `LessonCompleted → SRS` 已实现：`completeLesson()` 将该课全部 `qa_pairs` upsert 进 `review_schedule`（SM-2 初值 interval=1 / ease=2.5）。⚠️ `terms` 类型卡片尚未入队。

---

## DDD — 聚合根 & 实体 & 值对象

```mermaid
classDiagram
    class LearningSession {
        <<Aggregate Root>>
        +SessionId id
        +UserId userId
        +LessonId lessonId
        +SpeakingAttempt[] attempts
        +complete()
        +addAttempt(audio, score)
    }

    class PlacementTest {
        <<Aggregate Root>>
        +TestId id
        +UserId userId
        +EvaluationRound[] rounds
        +CEFRResult result
        +addRound(question, transcript, score)
        +complete() CEFRResult
    }

    class ReviewCard {
        <<Aggregate Root>>
        +CardId id
        +QAPairId qaPairId
        +UserId userId
        +SRSState state
        +answer(score 1~5)
        +isDue() bool
    }

    class UserProgress {
        <<Aggregate Root>>
        +UserId userId
        +LessonId currentLesson
        +LessonId[] completedLessons
        +advanceTo(lessonId)
        +markComplete(lessonId)
    }

    class Subscription {
        <<Aggregate Root>>
        +UserId userId
        +Plan plan
        +SubscriptionStatus status
        +upgrade(plan)
        +cancel()
    }

    class SRSState {
        <<Value Object>>
        +Date nextReviewAt
        +Float easeFactor
        +Int intervalDays
        +Int repCount
        +recalculate(score) SRSState
    }

    class CEFRResult {
        <<Value Object>>
        +CEFRLevel level
        +Float confidence
        +LessonId startingLesson
    }

    class Plan {
        <<Value Object>>
        +PlanType type
        +feature(key) bool
    }

    LearningSession --> SpeakingAttempt
    PlacementTest --> EvaluationRound
    PlacementTest --> CEFRResult
    ReviewCard --> SRSState
    Subscription --> Plan
```

---

## DDD — 领域事件流

```mermaid
graph LR
    UR["UserRegistered"] -->|初始化| UP["UserProgress\n从 A1 开始"]
    UR -->|创建| FS["Subscription\nfree plan"]

    AC["AssessmentCompleted\nCEFRLevel"] -->|设置起点| UP

    LC["LessonCompleted\nlessonId + userId"] -->|✅ 已实现| RC["创建 ReviewCards\n为所有 QAPairs"]

    RA["ReviewAnswered\nscore 1~5"] -->|SM-2 算法| SS["更新 SRSState\nnext_review_at\nease_factor"]
```

---

## 本地运行

```bash
cp .env.example .env.local   # 填入 Supabase / OpenAI key
npm install
npm run dev                   # Next.js 页面 + /api/v1
```

## 文档

- `CLAUDE.md` — AI Agent 架构说明和开发约定
