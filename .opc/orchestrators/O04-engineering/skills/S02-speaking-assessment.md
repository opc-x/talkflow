# S02 · 口语评估链路

## 链路

```
录音(WebM) → POST /api/v1/assessment/evaluate
           → Whisper 转录
           → GPT-4o 评分
           → { score, transcript, feedback }
```

## 评估维度

发音准确性30% / 流利度25% / 内容准确性30% / 词汇15%

## 反馈原则

先肯定 → 最多2个改进点 → 给示范句。100字内，中文解释+英文示范。

## 关键文件

`backend/src/routes/assessment.ts` / `lib/api/client.ts` (apiFetch)
