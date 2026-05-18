# v0 作战手册

> TalkFlow 专用。目标不是“会用 v0”，而是把 v0 最值钱的能力用在该花钱的地方，把 Claude Code / Codex 留给接业务逻辑、修 bug、落库和验证。

截至 2026-05-18，本手册按 v0 官方文档和 TalkFlow 当前栈整理。v0 产品和计费变化很快，价格和模型成本以官网为准。

## 结论

现有旧版指南只讲了“v0 能生成 UI”，没有讲清楚它真正强在哪里。

v0 最有价值的不是让它随便吐一段 React，而是这几件事：

1. **把文字、截图、Figma 直接变成可运行的现代 Web app**。
2. **在真实预览里迭代 UI**，尤其是 Design Mode 选中元素后做精修。
3. **吃进 Tailwind、globals.css、shadcn/ui、registry/design system 上下文**，让生成结果贴近项目风格。
4. **接 GitHub 分支、自动 commit、开 PR**，让 AI 生成结果进入正常代码审查流程。
5. **连 Vercel preview / env / integrations**，快速把原型推进到可访问、可测试的状态。
6. **用 v0 Platform API / MCP 把生成能力接进自动化工作流**，而不是每次手动开网页聊天。

TalkFlow 应该把 v0 当成“前端产品形态和 UI 实现加速器”，不是通用后端工程师。

## 定位驱动的设计标准

TalkFlow 的页面不能只是“好看”。它要按照《定位》那类思路去抢用户心智：让用户一眼知道“这就是解决我这个问题的东西”。

每个重要页面开工前，先回答五个问题：

| 问题 | 作用 | TalkFlow 示例 |
|------|------|---------------|
| 心智占位 | 我们要在用户脑子里占哪个词 | 不靠背稿，靠练到脱口而出 |
| 痛点触发 | 用户已经在焦虑什么 | 学了很多年，真开口还是卡住 |
| 核心承诺 | 一句话讲清结果 | 用真实场景练到自然说出口 |
| 可信证据 | 凭什么信你 | 场景对话、音频跟练、回合反馈、进度记录 |
| 下一步动作 | 页面要推动什么行为 | 立即开始一段练习 / 选择一个场景 |

视觉上要做到“高端但克制”：靠字体层级、留白、对比、产品真实状态、清晰动线建立高级感，不靠一堆渐变、发光、抽象装饰和空洞大词。

文案上要做到“短、狠、准”：先说用户脑子里已经存在的痛，再给一个可信的解决路径。少讲功能列表，多讲用户为什么现在就需要行动。

## 官方能力地图

官方文档把 v0 定义成 AI-powered development platform：用自然语言构建生产级 full-stack web apps，支持 web search、site inspection、auto-fix、external tools，并且和 Vercel 生态深度集成。

核心能力：

| 能力 | 官方说明 | TalkFlow 怎么用 |
|------|----------|----------------|
| 自然语言生成 app | 描述想法即可生成现代 Web app | 页面级 UI、练习流程、dashboard、表单 |
| 截图 / mockup / Figma 转代码 | 从 wireframe、mockup、Figma 生成高保真 UI | 用现有 Figma schema、竞品截图、手绘草图喂给它 |
| Design Mode | 在真实 preview 里选中元素，调 typography、颜色、布局、边框、阴影、文案，也能对选中元素继续 prompt | 少花 token 做细节打磨，别每次整页重生 |
| Design system / registry | 支持 Tailwind config、globals.css、shadcn/ui registry | 把 TalkFlow 的 token、组件约束喂进去，减少风格跑偏 |
| GitHub 集成 | chat 连仓库后自动建 `v0/main-*` 分支，每次代码变更自动 commit，可开 PR | 让 v0 只在隔离分支上改，Codex review 后合并 |
| Vercel 集成 | env vars、integrations、GitHub 自动部署、domain 与 Vercel project 联动 | 快速拿 preview URL 验证页面和分享 |
| Model API | OpenAI-compatible API，支持 text/image、streaming、tool calls，`v0-1.5-md` 做日常 UI，`v0-1.5-lg` 做复杂推理 | 自动化生成页面草案、组件草案、视觉变体 |
| Platform API | projects、chats、messages、deployments 等接口 | 后续可做 TalkFlow 内部 UI 生成流水线 |

官方参考：

- [What is v0](https://v0.app/docs)
- [Design Mode](https://v0.app/docs/design-mode)
- [Figma](https://v0.app/docs/figma)
- [Design Systems](https://v0.app/docs/design-systems)
- [GitHub](https://v0.app/docs/github)
- [Vercel Integration](https://v0.app/docs/vercel-integration)
- [v0 Model API](https://v0.app/docs/api/model)
- [v0 Platform API](https://v0.app/docs/api/platform/overview)
- [Pricing](https://v0.app/docs/pricing)

## TalkFlow 的最佳分工

| 任务 | 用 v0 | 用 Codex / Claude Code |
|------|------|------------------------|
| Landing page、auth 页面、dashboard、pricing、settings | 主力 | 接入项目、修类型、测试 |
| 学习会话页、对话练习页、录音状态 UI | 主力出第一版和视觉变体 | 接 Supabase、音频、状态机、权限 |
| 从 Figma / 截图还原 UI | 主力 | 组件化、拆文件、接真实数据 |
| 微调 padding、颜色、字体、边框、阴影 | Design Mode | 必要时落地 CSS token |
| RLS、Supabase auth、SQL、Edge Functions | 不建议 | 主力 |
| API routes、数据库 schema、复杂状态流 | 可给草案 | 主力 |
| bug 修复、回归测试、CI | 只修它自己 preview 里的明显错误 | 主力 |
| 大规模重构 | 不建议 | 主力 |

判断原则：**v0 负责看得见、能跑起来、能比较的界面；Codex 负责正确性、工程化和上线质量。**

## 不要再这样浪费钱

### 低价值用法

- “做个漂亮页面”这种空 prompt。
- 每次小改都让 v0 整页重新生成。
- 没给项目 token、组件约束、现有文件，导致返工。
- 让 v0 猜业务规则、数据库表、权限边界。
- 一边不满意一边连续追问，没先冻结目标。

### 高价值用法

- 先给 v0 一份清楚的页面规格：目标用户、信息层级、状态、组件、约束、禁区。
- 从一个页面或一个复杂组件开始，不要一次塞整个产品。
- 能用 Design Mode 精修的，不要重新 prompt 整页。
- 先让 v0 出 2-3 个视觉方向，再选一个继续迭代。
- 每轮只改一类问题：布局、视觉、交互、文案、响应式，不要混在一起。
- 生成后立刻让 Codex 接入 repo、跑 lint/typecheck、做人工 review。

## 标准工作流

### 1. 准备上下文

每次开 v0 前先收集：

- 页面目标：这个页面帮用户完成什么事。
- 目标路径：URL、入口、下一步。
- 设计系统：颜色、字体、radius、spacing、shadcn 组件、Tailwind token。
- 数据形状：只给 UI 需要的 mock 数据，不让它猜数据库。
- 状态：loading、empty、error、success、disabled、permission denied。
- 响应式：mobile、tablet、desktop 的关键布局差异。
- 禁区：不要改 auth、不要新增未知依赖、不要碰 Supabase schema 等。

### 2. 选择输入方式

| 输入 | 适用场景 | 备注 |
|------|----------|------|
| 文字 prompt | 新页面、新组件、方向探索 | 最便宜但最依赖表达 |
| 截图 | 仿竞品、还原视觉、指出问题 | 适合“像这个但不是抄” |
| Figma link | 已有设计稿 | 官方说会分析视觉结构和 design tokens，通常比截图更准 |
| GitHub repo | 改现有页面 | 最适合让它按现有项目结构输出 |
| Design system / registry | 长期复用 | 适合把 TalkFlow 的组件风格固定下来 |

### 3. 首轮 prompt

首轮不要只说“做页面”。按这个结构写：

```md
Build the TalkFlow [page/component name].

Product context:
- TalkFlow helps Chinese speakers practice English conversation through scene-based audio/dialogue sessions.
- The app should feel focused, calm, premium, and practice-oriented. Avoid generic SaaS hero clutter.

Positioning strategy:
- Mental position to own: [例如：不靠背稿，靠练到脱口而出]
- User pain to trigger: [例如：学了很多年，真开口还是卡住]
- Promise: [一句话讲清可相信的结果]
- Proof mechanism: [场景对话 / 音频跟练 / 回合反馈 / 进度记录]
- Primary action: [立即开始练习 / 选择场景 / 创建账号]

Route and stack:
- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, lucide-react.
- Use semantic HTML and accessible controls.

Design system:
- Background: #0B0F14
- Surface: #111827 / #172033
- Primary: #10B981
- Accent: #60A5FA
- Radius: 8px max for cards and tool surfaces
- Avoid purple/blue gradient-heavy SaaS visuals.

User goal:
- [具体目标]

Content hierarchy:
- [从上到下列信息结构]
- 每一段都必须服务：抢注意力、刺痛点、证明机制、降低顾虑、推动行动。

Copy direction:
- Lead with pain/outcome, not feature descriptions.
- Keep copy short, direct, and psychologically sharp.
- Avoid generic SaaS copy, vague AI claims, and long explanatory text.

States:
- Loading: ...
- Empty: ...
- Error: ...
- Success: ...

Interactions:
- [按钮、tab、录音、进度、hover、disabled 等]

Responsive behavior:
- Mobile: ...
- Desktop: ...

Constraints:
- Do not implement real Supabase auth/database logic.
- Use mock data only.
- Do not add unrelated marketing sections.
- Keep components easy to extract into the existing TalkFlow repo.
- Premium should come from typography, spacing, contrast, and product realism, not ornamental clutter.
```

### 4. 迭代顺序

1. **信息结构**：页面是不是解决了正确问题。
2. **布局**：密度、层次、响应式。
3. **视觉语言**：颜色、字体、边框、阴影、动效。
4. **状态完整性**：loading、empty、error、success、disabled。
5. **代码落地**：拆组件、接真实数据、跑测试。

不要跳过前两步直接调颜色。结构错了，颜色调再多都没用。

### 5. Design Mode 精修

Design Mode 是省钱和提高命中率的关键。

官方说明里，Design Mode 可以在 preview 里选中元素，直接改 typography、color、background、layout、border、appearance、shadow、content；也可以对选中元素输入自然语言指令。应用后会生成新的 chat version，代码 diff 可审查、可回退。

用法建议：

- padding、font-size、line-height、radius、shadow、文本，先用 panel 调。
- “这张卡片改成三列统计 + 右侧趋势图”这种结构变化，再用选中元素 prompt。
- 每次只选一个区域改，别对整页说“更高级”。
- Apply 前看 before/after，确认没伤到其他区域。

## v0 + GitHub 工作流

官方 GitHub 集成的重点：

- v0 连仓库后会从 `main` 自动建独立分支，例如 `v0/main-abc123`。
- 代码变更会自动 commit。
- v0 不直接 push 到 `main`。
- 完成后通过 PR 合并。

TalkFlow 推荐流程：

1. v0 生成或修改页面。
2. Publish / Open PR，不要直接复制一堆代码到 main。
3. Codex 拉取 v0 分支或 PR diff。
4. Codex 做三件事：组件拆分、业务逻辑接入、lint/typecheck/build。
5. 人工看 preview，确认再 merge。

如果没有走 GitHub 集成，也可以复制代码给 Codex，但成本更高：需要手动判断依赖、路径、文件边界和遗漏状态。

## 计费与成本控制

截至 2026-05-18，官网显示：

- Free：$0/month，官方 docs 显示 $5 monthly credits。
- Premium：$20/month，官方 docs 显示 $20 monthly credits。
- Team：$30/user/month，官方 docs 显示 $30 monthly credits per user。
- Business：$100/user/month，官方 docs 显示 $30 monthly credits per user。
- Enterprise：custom。
- Premium、Team、Business 可额外购买 credits。
- Generations 会消耗 credit balance；用完后 generation pauses。
- 未用完的 monthly credits 会 roll over 到下个 billing cycle，并在 65 天后过期。
- Model API 需要 Premium 或 Team，并开启 usage-based billing。

不要把“$20 一个月随便用”当事实。v0 是 credit/token 计费，复杂上下文、长 prompt、图片、全栈任务、反复修 bug 都会烧钱。

省钱规则：

- 用 `v0-1.5-md` 做日常 UI；复杂规划、疑难生成再用更强模型。
- 先让 Codex 帮你写 prompt，再丢给 v0。
- 大页面拆成 section/component 生成，再组合。
- 视觉微调用 Design Mode panel。
- 用 GitHub diff 审查，发现方向错马上停，不要连续追问。
- 把成功 prompt 记录下来复用。

## TalkFlow 复用素材

现有可喂给 v0 的项目资料：

- `docs/ui-ux/v0-design-system.md`
- `docs/ui-ux/figma-design-schema.md`
- `docs/design/learning-session.md`
- `docs/design/overview.md`
- `docs/product/product-vision.md`

生成 UI 前，优先让 Codex 从这些文件抽取“本次页面需要的约束”，不要整份无脑贴进去。

## 已创建 Codex Skill

为了避免每次重新解释，本仓库新增了：

- `.agents/skills/v0/SKILL.md`
- `.agents/skills/v0/references/prompt-patterns.md`
- `.agents/skills/v0/references/cost-control.md`

以后你可以直接说“用 v0 skill 给我做 auth 页 prompt / review 这个 v0 输出 / 生成 v0 任务说明”，Codex 应该按这个工作流执行。

## 历史记录

| 日期 | 用途 | Chat 链接 | Issue |
|------|------|---------|-------|
| 2026-05-18 | 落地页生成 | https://v0.app/chat/bUcsrtZosOz | #5 |
| 待做 | Auth 页生成 | - | #7 |
