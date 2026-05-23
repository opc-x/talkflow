# TalkFlow

AI 驱动的英语口语练习。核心循环：**看图 → 开口说 → AI 实时纠错 → SRS 复习**

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
        FE["Next.js Frontend :3000\nApp Router + Supabase 直连\n课程 / 复习 / 评测 / 统计"]
        BE["Hono API Backend :4000\nAI 密集型操作\n音频评测 + 定位"]
    end

    SB[("Supabase\nPostgreSQL + Auth + RLS")]
    OAI["OpenAI API\nWhisper + GPT-4o"]
    STR["Stripe API"]

    User -->|HTTPS| FE
    FE -->|supabase-js 直连| SB
    FE -->|fetch /api/v1 + JWT| BE
    BE -->|JWT 验证| SB
    BE -->|音频 + 评测| OAI
    BE -->|checkout| STR
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
    BE["Hono API :4000"]

    OB -->|评测音频| BE
    LP -->|完课写入| SB
    LP -->|音频评分| BE
    SRS -->|读写 review_schedule| SB
    STATS -->|读 session_records| SB
    AUTH -->|session 管理| SB
```

---

## C4 L3 — 组件：Backend

```mermaid
graph TB
    subgraph BE["Hono API Backend"]
        AM["Auth Middleware\nJWT 验证 + userId 注入"]
        AE["Assessment Evaluator\nWhisper 转写 + GPT-4o 评分"]
        AP["Placement Scorer\n多轮评测 → CEFR 定级"]
        CK["Checkout\nStripe stub（未完成）"]
    end

    FE["Next.js Frontend"]
    OAI["OpenAI API"]
    SB[("Supabase DB")]

    FE -->|Bearer JWT| AM
    AM --> AE & AP & CK
    AE -->|Whisper + GPT-4o| OAI
    AP -->|写入定级结果| SB
```

---

## 本地运行

```bash
cp .env.example .env.local   # 填入 Supabase / OpenAI key
npm install
cd backend && npm install && cd ..
npm run dev:all               # 前端 :3000 + 后端 :4000
```

## 文档

- `CLAUDE.md` — AI Agent 架构说明和开发约定
