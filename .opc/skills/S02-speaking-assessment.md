# S02 — 口语评估系统

## 职责

TalkFlow 核心 AI 能力：语音 → 转录 → 评分 → 反馈。

## 技术链路

```
用户录音 (WebM/WAV)
    ↓
POST /api/v1/assessment/evaluate
    ↓
Whisper API (transcription)
    ↓
GPT-4o (评估 + 反馈生成)
    ↓
返回：{ score, transcript, feedback, improvements }
```

## 评估维度

| 维度 | 权重 | 描述 |
|---|---|---|
| 发音准确性 | 30% | 单词发音对不对 |
| 流利度 | 25% | 停顿、语速 |
| 内容准确性 | 30% | 回答切不切题 |
| 词汇使用 | 15% | 用词是否恰当 |

## 反馈风格原则

- 先肯定（找到亮点）
- 1-2个具体改进点（不超过2个，否则学习者崩溃）
- 给出正确示范句
- 语气鼓励，像真人外教

## 关键文件

- `backend/src/routes/assessment.ts` — 评估路由
- `backend/src/middleware/auth.ts` — JWT验证
- `lib/api/client.ts` — 前端调用（apiFetch）
