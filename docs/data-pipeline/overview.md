# TalkFlow 数据处理流程

## 总览

```
Callan Method PDF（Book 1–12）
        ↓
  build_index.py        提取所有 vocab + Q&A 条目
        ↓
  index.json            19,698 条原始数据
        ↓
  build_clusters_v2.py  词族匹配 + 文本清洗
        ↓
  index_v2.json         18,477 条清洗后数据（过滤 1,221 条无效）
        ↓
  seed_supabase.py      导入 Supabase
        ↓
  Supabase DB           191 lessons / 3,751 clusters / 9,558 words / 9,012 Q&A
```

脚本位置：`kb-personal/callan-method/`

---

## 第一步：PDF 解析 → index.json

**脚本**：`build_index.py`（+ `convert.py` / `convert_html.py`）

**输入**：`~/Downloads/Callan Method {1-12}.pdf`

**原理**：
- 用 `pdftotext` 提取文本，识别 Lesson 边界
- 用 PyMuPDF (`fitz`) 检测蓝色矩形框 → 词族（vocab cluster）
- 识别蓝框内词汇（`t=v`）和 Q&A 对（`t=q`）
- 处理 Callan 私有字体编码（+31 ASCII 位移，Book 4/8 使用）

**输出字段**：
| 字段 | 说明 |
|------|------|
| `b`  | book 编号 1–12 |
| `l`  | lesson 全局编号 1–191 |
| `p`  | PDF 页码 |
| `y`  | PDF Y 坐标 |
| `t`  | `v`=词汇 / `q`=Q&A |
| `c`  | CEFR 级别 |
| `w`  | 词汇文本（`t=v`） |
| `q`  | 问题文本（`t=q`） |
| `a`  | 答案文本（`t=q`） |

---

## 第二步：词族精准匹配 → index_v2.json

**脚本**：`build_clusters_v2.py`

**问题背景**：原始 `index.json` 里 Q&A 条目的词族（`cl` 字段）是靠"位置继承"赋值的——找最近的上方蓝框。这种方法对连续内容准确，但跨页或跨课时会错。

**改进方案（v2）**：

```
匹配优先级：
  1. 词汇文本匹配（同课 → 相邻课）  ← 最精准，覆盖 95.6% Q&A
  2. 位置回退（同页最近蓝框）        ← 备用
  3. 空字符串                        ← 实在匹配不上（393 条）
```

**关键函数**：
- `normalize_ligatures()` — 统一 PDF 连字符（`ﬂ`→`fl`，`ﬁ`→`fi`），解决 PDF 字体编码不一致问题
- `decode_callan()` — 解码 Callan 私有字体（+31 ASCII 位移 + 控制字符映射）
- `clean_text()` — 组合解码 + 连字符 + 压缩空格
- `cluster_match_score()` — Q&A 文本与词族词汇重叠计数（过滤 <3 字符的功能词）
- `find_cluster_for_qa()` — 先词汇匹配，再位置回退
- `extract_page_clusters()` — 从 PDF 蓝框提取词族，**关键：提取时就做连字符 normalize**

**最终精度**：
| 类型 | 覆盖率 |
|------|--------|
| vocab 词族覆盖 | 80.2% |
| Q&A 词族覆盖  | 95.6% |

未覆盖的主要是介词/功能词（`on`、`in` 单独出现）及跨书找不到对应蓝框的条目。

**重跑方法**：
```bash
cd kb-personal/callan-method
/opt/homebrew/bin/python3 build_clusters_v2.py
# 输出：html/index_v2.json
```

---

## 第三步：导入 Supabase

**脚本**：`kb-personal/callan-method/seed_supabase.py`

**依赖**：
```bash
python3 -m venv /tmp/talkflow_venv
/tmp/talkflow_venv/bin/pip install supabase
```

**导入顺序（外键依赖决定）**：
1. `lessons` (191 行)
2. `vocab_clusters` (3,751 行) — lesson 为首次来源，Q&A-only cluster 也包含
3. `vocab_words` (9,558 行)
4. `qa_pairs` (9,012 行)

**注意**：导入前需临时开放 RLS INSERT 权限（脚本使用 anon key）：
```sql
-- 导入前执行（见 seed_supabase.py 注释）
CREATE POLICY "seed_insert_tmp" ON lessons  FOR INSERT TO anon WITH CHECK (true);
-- ... 其他表同理
-- 导入完成后立即 DROP
```

**重跑（全量重导）**：
```sql
-- 先清表（保留表结构和 RLS 策略）
TRUNCATE vocab_words, qa_pairs, vocab_clusters, lessons RESTART IDENTITY CASCADE;
```
然后执行 `seed_supabase.py`。

---

## 数据字段映射

```
index_v2.json  →  Supabase 表
─────────────────────────────────────────────────
b              →  lessons.book
l              →  lessons.lesson_num
b (=stage)     →  lessons.stage  (Callan stage = book 编号)
c              →  lessons.cefr_level
cl             →  vocab_clusters.cluster_text
cl (拆分)       →  vocab_clusters.words[]
w              →  vocab_words.word
q              →  qa_pairs.question
a              →  qa_pairs.answer
p              →  vocab_words/qa_pairs.page_index
y              →  vocab_words/qa_pairs.y_coord
```

---

## 后续待办

- [ ] 生成问题音频（OpenAI tts-1，~$15 一次性，存 Cloudflare R2）
- [ ] 场景图制作 + 热区坐标录入（参考 `charts/extracted/` 里的 Chart 1）
- [ ] 更新 `seed_supabase.py` 中的 `audio_url` 字段（批量 UPDATE）
- [ ] 修复未覆盖的 393 条 Q&A（可手动标注或用更宽松的位置匹配）

---

## 文件结构

```
kb-personal/callan-method/
├── build_index.py          Step 1：PDF → index.json
├── build_clusters_v2.py    Step 2：词族匹配 → index_v2.json  ← 主要修改此文件
├── seed_supabase.py        Step 3：index_v2.json → Supabase
├── html/
│   ├── index.json          Step 1 输出（原始）
│   └── index_v2.json       Step 2 输出（清洗后，当前版本）
└── charts/
    └── extracted/          从 PDF 提取的图表图片（Chart 1 = 场景参考图）
```
