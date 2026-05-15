# TalkFlow 设计系统规范

> 本文档定义 TalkFlow 的视觉设计规范，所有前端代码必须遵循此规范。

---

## 1. 品牌定位

- **产品定位**：AI 英语口语陪练，基于 Callan Method
- **目标用户**：已有基础口语能力 (Stage 3+) 的学习者
- **品牌调性**：鼓励、成长、轻松、专业

---

## 2. 配色方案

### 主色 (Primary)
- **翡翠绿** `#10B981` — 代表成长、自信、沟通
- HSL: `160 84% 39%`
- 用于：主按钮、进度条、品牌强调

### 强调色 (Accent)  
- **温暖橙** `#F59E0B` — 代表激励、成就、活力
- HSL: `38 92% 50%`
- 用于：奖励、成就、重要提示

### 中性色
| 用途 | 色值 | 说明 |
|------|------|------|
| 背景 | `#FAFBFC` | 浅灰白，不刺眼 |
| 卡片背景 | `#FFFFFF` | 纯白 |
| 主文本 | `#1F2937` | 深灰，不用纯黑 |
| 次要文本 | `#6B7280` | 中灰 |
| 边框 | `#E5E7EB` | 浅灰边框 |
| 分割线 | `#F3F4F6` | 极浅灰 |

### 语义色
| 语义 | 色值 | 用途 |
|------|------|------|
| 成功 | `#10B981` | 正确答案、完成状态 |
| 错误 | `#EF4444` | 错误提示、删除操作 |
| 警告 | `#F59E0B` | 警告、待处理 |
| 信息 | `#3B82F6` | 提示、链接 |

---

## 3. 字体规范

### 字体家族
```css
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace; /* 用于代码/英文例句 */
```

### 字号层级
| 用途 | 类名 | 大小 |
|------|------|------|
| 大标题 | `text-4xl` / `text-5xl` | 36-48px |
| 页面标题 | `text-2xl` / `text-3xl` | 24-30px |
| 区块标题 | `text-xl` | 20px |
| 正文 | `text-base` | 16px |
| 辅助文本 | `text-sm` | 14px |
| 小字 | `text-xs` | 12px |

### 字重
- **标题**：`font-bold` (700)
- **强调**：`font-semibold` (600)
- **正文**：`font-normal` (400)

### 行高
- 正文：`leading-relaxed` (1.625)
- 标题：`leading-tight` (1.25)

---

## 4. 间距系统

使用 Tailwind 默认 spacing scale，核心间距：

| 场景 | 间距 | Tailwind |
|------|------|----------|
| 组件内小间距 | 8px | `gap-2`, `p-2` |
| 组件内标准间距 | 12-16px | `gap-3`, `gap-4` |
| 区块间距 | 24px | `gap-6`, `py-6` |
| 大区块间距 | 32-48px | `gap-8`, `py-12` |
| 页面边距 | 16-24px | `px-4`, `px-6` |

---

## 5. 圆角规范

| 用途 | 圆角 | Tailwind |
|------|------|----------|
| 小按钮/标签 | 6px | `rounded-md` |
| 按钮/输入框 | 8px | `rounded-lg` |
| 卡片 | 12px | `rounded-xl` |
| 大卡片/弹窗 | 16px | `rounded-2xl` |

---

## 6. 阴影规范

| 层级 | Tailwind | 用途 |
|------|----------|------|
| 无阴影 | — | 内嵌元素 |
| 轻微 | `shadow-sm` | 卡片默认 |
| 标准 | `shadow-md` | 悬浮卡片 |
| 强调 | `shadow-lg` | 弹窗、下拉 |

---

## 7. 组件规范

### 按钮

**主按钮 (Primary)**
```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90 
           px-6 py-3 rounded-lg font-semibold transition-colors"
```

**次要按钮 (Secondary)**
```tsx
className="bg-secondary text-secondary-foreground hover:bg-secondary/80
           px-6 py-3 rounded-lg font-medium transition-colors"
```

**幽灵按钮 (Ghost)**
```tsx
className="hover:bg-accent hover:text-accent-foreground
           px-4 py-2 rounded-lg transition-colors"
```

### 卡片
```tsx
className="bg-card rounded-xl border border-border p-6 shadow-sm"
```

### 输入框
```tsx
className="w-full px-4 py-3 rounded-lg border border-input 
           bg-background focus:ring-2 focus:ring-primary/20 
           focus:border-primary transition-all"
```

### 进度条
```tsx
// 背景
className="h-2 bg-muted rounded-full overflow-hidden"
// 填充
className="h-full bg-primary rounded-full transition-all duration-300"
```

---

## 8. 布局原则

### 优先级
1. **Flexbox** — 90% 的布局场景
2. **CSS Grid** — 只在需要二维布局时使用
3. **绝对定位** — 尽量避免

### 响应式断点
| 断点 | 宽度 | 用途 |
|------|------|------|
| 默认 | < 640px | 手机 |
| `sm:` | ≥ 640px | 大手机/小平板 |
| `md:` | ≥ 768px | 平板 |
| `lg:` | ≥ 1024px | 桌面 |
| `xl:` | ≥ 1280px | 大桌面 |

### 最大宽度
- 内容区：`max-w-4xl` (896px)
- 宽内容：`max-w-6xl` (1152px)
- 全宽带边距：`max-w-7xl mx-auto px-4`

---

## 9. 动画规范

### 过渡时长
- 快速交互（hover）：`duration-150`
- 标准过渡：`duration-200` 或 `duration-300`
- 页面切换：`duration-500`

### 缓动函数
- 默认：`ease-out`
- 弹性：`ease-in-out`

### 常用动画类
```tsx
// 悬浮效果
"transition-colors duration-200"
"transition-all duration-200"
"hover:scale-105 transition-transform"

// 淡入
"animate-in fade-in duration-300"
```

---

## 10. 图标规范

- **图标库**：Lucide React
- **默认大小**：20px (`w-5 h-5`)
- **按钮内图标**：16px (`w-4 h-4`)
- **大图标**：24px (`w-6 h-6`)

```tsx
import { Mic, Volume2, Check } from "lucide-react"

<Mic className="w-5 h-5" />
```

---

## 11. 设计 Tokens (CSS 变量)

所有颜色通过 CSS 变量定义在 `globals.css`：

```css
:root {
  --background: 210 20% 98%;      /* #FAFBFC */
  --foreground: 215 25% 17%;     /* #1F2937 */
  --primary: 160 84% 39%;        /* #10B981 */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 20% 96%;
  --accent: 38 92% 50%;          /* #F59E0B */
  --muted: 210 20% 96%;
  --muted-foreground: 215 15% 47%;
  --border: 214 20% 90%;
  --input: 214 20% 90%;
  --ring: 160 84% 39%;
  --radius: 0.5rem;
}
```

---

## 12. 禁止事项

- **禁止使用** 纯黑 `#000000`，用 `#1F2937`
- **禁止使用** 超过 5 种颜色
- **禁止使用** 复杂渐变（除非特殊场景）
- **禁止使用** 紫色作为主色（除非明确要求）
- **禁止使用** emoji 作为图标
- **禁止使用** `space-x/y`，用 `gap`
- **禁止使用** 像素任意值 `p-[17px]`，用 scale `p-4`

---

## 快速参考

```tsx
// 主按钮
<Button className="bg-primary hover:bg-primary/90">开始练习</Button>

// 卡片
<div className="bg-card rounded-xl border p-6 shadow-sm">

// 成功状态
<div className="text-emerald-600 bg-emerald-50 rounded-lg p-4">

// 进度条
<div className="h-2 bg-muted rounded-full">
  <div className="h-full bg-primary rounded-full" style={{width: '60%'}} />
</div>
```
