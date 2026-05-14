# 知识库质量评估 & 产品量化基准

> 记录时间：2026-05-14
> 评估背景：基于 Callan Method 12册教材，目标用户群为希望通过高频练习达到口语 B2 水平的学习者

---

## 一、四维评分

### 1. 教材完整度：84 / 100

**评估对象：** 数据库内容对原版 Callan Method 12册教材的覆盖程度

| 项目 | 数量 | 状态 |
|------|------|------|
| 教材册数 | 12 册 | 全覆盖 |
| 课时 | 191 课 | 全覆盖 |
| Content Blocks | 9,160 块 | 全覆盖 |
| 词汇条目 | 7,250 条 | 全覆盖 |
| 问答对 | 11,412 对 | 全覆盖 |
| 语法注释 | 1,803 条 | 全覆盖 |
| 听写练习 | 130 条 | 全覆盖 |
| 数据验证 | 15/15 项通过 | 0 孤立记录 |

**扣分原因（-16分）：**
- 图表为文字引用（"See Chart 1"），视觉内容未提取 —— 约 -6
- 音频/发音数据完全缺失，Callan 是听说方法，这是结构性缺口 —— 约 -8
- 13 个 block 无 embedding（次要，可修复）—— 约 -2

---

### 2. 向量化质量：74 / 100

**评估对象：** content_blocks 的 embedding 质量及检索架构

**架构：**
- 模型：`text-embedding-3-small`，1536 维
- 索引：HNSW cosine distance（`idx_blocks_embedding_hnsw`）
- 检索：hybrid（向量 + PostgreSQL 全文检索 `websearch_to_tsquery`）

**关键修复（2026-05-14）：**

原始 embedding 的问题：3,484 个 lexical_block 平均只有 25 字符，72% 不足 30 字符（如 `"or"`、`"large | small"`）。单词列表缺乏语境，向量无效。

修复方案：每个 lexical_block 的 embedding 输入改为：
```
{metadata prefix}
{词汇文本}
{紧跟的 qa_block / grammar_note 文本，直到下一个 lexical_block}
```

效果验证：
- `"or"` 的最近邻包含 `"long | short"`（sim 0.831）—— 因为 "or" 的 qa context 是 "Is the table long **or** short?"
- `"large | small"` 的最近邻包含 `"tall | short"`（sim 0.748）、`"high | low"`（sim 0.734）

**扣分原因（-26分）：**
- `qa_pairs.question_embedding` / `answer_embedding`：11,412 对未向量化 —— 约 -10
- `notes.embedding`：1,803 条未向量化 —— 约 -8
- App 层搜索 API 已实现但 auth 未端到端验证 —— 约 -5
- grammar_note embedding 未做 contextual 增强 —— 约 -3

---

### 3. 教材够用指数（听说口语 B2）：91 / 100

**评估前提：**
- 目标：功能性口语 B2，不考试，不含学术词汇
- 只考量听力和口语维度

**为什么高分：**
- Callan Method 本身就是为听说设计，官方定位 Book 12 = B2
- 7,250 词汇对口语 B2 超配（口语活跃词汇需求约 4,000–5,000）
- 11,412 问答对是口语输出的核心弹药
- 语法体系对口语 B2 全覆盖（时态/情态/条件/被动）
- 听写练习覆盖听力训练

**扣分原因（-9分）：**
- 口音单一，缺少英音/美音/澳音混合材料，听力泛化能力有限

---

### 4. 高频练习达到口语 B2 的概率：83 / 100

**评估前提：**
- 已通过机构完成 3 个 Stage 的真人训练，可脱口而出至少 3 句完整句
- App 后续有口语练习模块（假设已有）
- 目标为功能性口语 B2，非考试认证

**为什么高分：**
- 语言自动化机制已启动（能脱口而出是关键指标，这是最难跨的坎）
- 内容对目标高度匹配
- 机构真人 + App 强化的组合路径清晰

**剩余 17% 风险：**
- Stage 7–12 语法复杂度跳跃，自学阶段容易停滞
- 高频练习的持续性是最大变量

---

## 二、Block 划分原理（用于量化模块参考）

Callan 教学节奏是严格的「词汇引入 → 即时操练」配对结构：

```
lexical_block: "long | short | the | contraction"
       ↓ 紧跟
qa_block:      "Q: Is the pen short? A: No, the pen isn't short; it's long"
```

**设计结论：**
- Callan 的自然语义单元 = lexical_block + 紧跟的 qa_block(s)
- 词汇分组遵循主题语义（教室物品/反义形容词/数字等），设计正确
- 相关性高的内容确实是相邻的 —— Callan 教材设计本身就有这个严谨性

**Block 类型分布：**

| 类型 | 数量 | 平均字符 | 向量质量（修复后） |
|------|------|---------|----------------|
| `qa_block` | 3,520 | 334 | 好（原本就有完整句子） |
| `lexical_block` | 3,484 | 25 | 修复后好（contextual embedding）|
| `grammar_note` | 1,803 | 70 | 中（未做 contextual 增强）|
| `dictation` | 130 | 521 | 好 |
| `front_matter` | 146 | 238 | 一般 |

---

## 三、产品量化模块方向（待开发）

基于以上评估，量化模块应跟踪的核心指标：

### 3.1 学习进度量化
- 用户掌握词汇数 / 7,250（词汇覆盖率）
- 用户能流利回答的 qa_pair 数 / 11,412（口语输出覆盖率）
- 已完成 Stage 数（Stage 1–12）

### 3.2 掌握度量化（每个 lexical_block）
- 反应速度：答题延迟（毫秒）
- 准确率：回答是否包含关键词
- 间隔重复：SM2 算法已在 `review_schedule` 表预留

### 3.3 B2 距离估算
可基于：
- 词汇覆盖率 × 权重
- 高频词汇优先（Stage 1–6 词汇权重更高）
- 口语流利度代理指标（反应速度分布）

### 3.4 口语练习模块（关键缺口）
Callan 的核心机制是**实时压力** — 老师以母语者语速提问，学生立刻回答，不允许停顿翻译。

App 需要复制这个机制才能让内容转化为真正的口语能力。形式可以是：
- AI 扮演 Callan 老师角色，按书中 Q&A 对话提问
- 用语音识别评估回答延迟和关键词
- 「语伴」模块让真人用户互相做 Callan 式问答操练

**没有这个模块，内容掌握度高也只是「认识但说不出来」。**

---

## 四、当前系统架构快照

```
数据库（Supabase）
  content_blocks（已向量化，HNSW 索引）
    ├── lexical_block × 3484（contextual embedding，2026-05-14 重跑）
    ├── qa_block × 3520（原始 embedding，质量良好）
    └── grammar_note × 1803（原始 embedding，待增强）

检索层
  match_content_blocks()     — 向量语义检索
  search_content_blocks_text() — 全文检索（websearch_to_tsquery）

App 层（Next.js）
  POST /api/search           — hybrid 检索路由（已实现，待 auth 验证）
  lib/embedding.ts           — OpenAI query embedding 封装
  lib/types.ts               — 类型定义
```
