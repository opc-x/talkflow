# 场景图 + 热区 + 音频 设计方案

## 核心原则

Callan Q&A 是固定脚本，问题不会变 → 能提前生成的全部提前生成，实时调用只做必须实时的部分。

---

## 场景图 + 热区

### 设计思路

Callan 词汇按场景聚集，一张图覆盖一组词汇：

```
Lesson 1: table, chair, wall, floor, ceiling, window, door...
→ 一张"教室/室内"场景图覆盖全部
```

**12 本书估计需要 60–100 张场景图，不是 19,698 张。**

### 热区数据结构

```json
{
  "scene_id": "classroom-basic",
  "image_url": "https://xxx.supabase.co/storage/scenes/classroom-basic.png",
  "hotspots": [
    { "word": "table",   "x": 120, "y": 340, "w": 180, "h": 80 },
    { "word": "chair",   "x": 310, "y": 380, "w": 90,  "h": 120 },
    { "word": "window",  "x": 40,  "y": 80,  "w": 200, "h": 150 },
    { "word": "ceiling", "x": 0,   "y": 0,   "w": 640, "h": 60 }
  ]
}
```

### 热区管理工具

内部用，做一次永久复用：
1. 上传场景图
2. 点击拖拽圈定区域
3. 输入对应词汇名
4. 保存坐标到数据库

### 前端渲染

```tsx
<div className="relative">
  <img src={scene.imageUrl} />
  {activeWord && (
    <div
      className="absolute border-2 border-yellow-400 animate-pulse rounded"
      style={{
        top: hotspot.y, left: hotspot.x,
        width: hotspot.w, height: hotspot.h
      }}
    />
  )}
</div>
```

---

## 问题音频

### 为什么提前生成

- Callan 问题是死的固定脚本，永远不变
- 实时 TTS 有延迟、有抖动、有 API 成本
- 提前生成 = 零延迟 + 声音永远一致 + 边际成本为零

### 生成方案

- **TTS 引擎**：OpenAI `tts-1`（稳定，英式/美式可选）
- **数量**：19,698 条问题
- **一次性成本**：~100 万字符 × $15/1M = **约 $15**
- **存储**：Supabase Storage

### 音频文件命名

```
audio/questions/b{book}-l{lesson}-q{index}.mp3

示例：
audio/questions/b1-l1-q0.mp3
audio/questions/b1-l1-q1.mp3
```

---

## 整体架构

```
固定资源（提前生成，存 Supabase Storage）
├── 场景图（60–100 张）
├── 热区坐标（JSON，存数据库）
└── 问题音频（19,698 个 .mp3）

实时调用（每次练习）
├── 用户说话 → Whisper STT → 转文字
├── 文字 + 标准答案 → Claude API → 评估 + 纠错
└── 评估结果 → 下一题 or 重复
```

### 成本结构

| 部分 | 成本类型 | 估算 |
|------|---------|------|
| 问题音频生成 | 一次性 | ~$15 |
| 场景图生成 | 一次性 | ~$30–50（AI 生图） |
| Whisper STT | 每用户每次 | $0.006/分钟 |
| Claude 评估 | 每用户每次 | ~$0.05–0.10/课 |

20 分钟一节课，每用户边际成本约 **$0.10–0.15**。

---

## 待决策

- [ ] 场景图风格（写实 / 扁平插画 / 卡通）
- [ ] TTS 声音选择（英式 or 美式，男声 or 女声）
- [ ] 热区管理工具：内嵌进后台 or 独立脚本
