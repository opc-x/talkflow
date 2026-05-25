# S10 — 内容生产流水线

## 职责

Callan Method 原材料 → TalkFlow 格式的标准转换 SOP。

## 转换流程

```
Callan PDF/文本
    ↓
Step 1: 解析结构（识别课次、Q&A对、词汇表）
    ↓
Step 2: 清洗（去除排版符号、标注CEFR级别）
    ↓
Step 3: 转换格式（Callan命令式→TalkFlow对话式）
    ↓
Step 4: AI增强（生成发音提示、补充例句、添加文化注释）
    ↓
Step 5: 入库（seed脚本写入 Supabase）
    ↓
Step 6: 人工验收（抽查10%，检查翻译准确性）
```

## 数据库格式

```sql
-- 每条 qa_pair
{
  lesson_id: UUID,
  question: "Is this a book?",
  answer: "Yes, it is. It's a book.",
  cefr_level: "A1",
  order_index: 1
}
```

## 质量标准

- 问题必须能用录音评估（避免主观题）
- 答案长度：1-3句（太长无法流利说）
- 覆盖Callan原有重复机制（同词汇在5课内重复出现）

## 已完成

- 191课全部 seed 入库（2025年）
- qa_pairs 完整
- 待补充：发音音频（TTS生成示范）
