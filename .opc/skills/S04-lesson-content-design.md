# S04 — 课程内容设计

## 职责

设计 TalkFlow 课程交互流程和内容呈现逻辑。

## 课程结构（每课）

```
导入（30秒）→ 示范听（1分钟）→ 跟读练习 → Q&A对话 → 完成确认
```

## 内容块类型

| type | 用途 |
|---|---|
| `vocabulary` | 新词展示 + 例句 |
| `qa_pair` | 问答对（SRS核心） |
| `note` | 语法/文化注释 |
| `exercise` | 句型替换练习 |

## Callan → TalkFlow 转换原则

- 保留：Q&A结构、重复机制、速度训练
- 去除：纯读写练习、填空题
- 增加：AI实时评分、录音回放、发音高亮
- 语调：Callan是命令式，TalkFlow改为对话式

## 难度爬坡设计

```
A1: 单词/短语（What is this? It's a...）
A2: 简单句（I go to... every day.）
B1: 连接句（Although..., I still...）
B2: 抽象话题（In my opinion...）
C1+: 观点表达 + 辩论
```
