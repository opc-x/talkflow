"use client"

import { useRef, useState, useEffect } from "react"
import { Eye, Repeat, Zap } from "lucide-react"
import { COPY } from "@/lib/copy"

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15, ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

/* ─── Chat item type ─────────────────────────────────────────── */
type ChatItem =
  | { kind: "ai"; question: string; sub: string; delay: number }
  | { kind: "wrong"; text: string; hint: string; delay: number }
  | { kind: "correct"; text: string; hint: string; delay: number }

const CHAT_ITEMS: ChatItem[] = [
  { kind: "ai",      question: "What is the woman doing?",         sub: "她在做什么？",   delay: 300  },
  { kind: "wrong",   text: "She study with laptop.",               hint: "✗ 语法有误，再说一次", delay: 900  },
  { kind: "correct", text: "She is studying with her laptop.",     hint: "✓ 正确，继续",        delay: 1500 },
  { kind: "ai",      question: "Where do you think they are?",     sub: "他们在哪里？",   delay: 2100 },
]

/* ─── LandingDemo ────────────────────────────────────────────── */
export function LandingDemo() {
  const { ref: sectionRef, inView } = useInView()

  return (
    <section
      ref={sectionRef}
      style={{ background: "#111111" }}
      className="py-20 px-4"
    >
      <div
        className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center"
        style={{
          opacity: 1,
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "transform 600ms ease-out",
        }}
      >
        {/* ── LEFT: Picture Practice Card ── */}
        <PictureCard inView={inView} />

        {/* ── RIGHT: Copy ── */}
        <RightCopy inView={inView} />
      </div>
    </section>
  )
}

/* ─── Left Column ────────────────────────────────────────────── */
function PictureCard({ inView }: { inView: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "border-color 300ms ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(16,185,129,0.20)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.08)")
      }
    >
      {/* Image area */}
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&q=80"
          alt="英语场景练习"
          crossOrigin="anonymous"
          className="w-full object-cover"
          style={{ height: "220px" }}
        />
        {/* Badge */}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full text-white"
          style={{ background: "rgba(16,185,129,0.85)" }}
        >
          📷 {COPY.featureBadge}
        </span>
      </div>

      {/* Chat area */}
      <div className="p-5 flex flex-col gap-3">
        {/* Mac-style window dots */}
        <div className="flex items-center mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#FF5F57", opacity: 0.6 }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full ml-1.5"
            style={{ background: "#FEBC2E", opacity: 0.6 }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full ml-1.5"
            style={{ background: "#28C840", opacity: 0.6 }}
          />
          <span
            className="ml-3 text-xs"
            style={{ color: "rgba(245,245,245,0.5)" }}
          >
            场景练习 · 第 4 课
          </span>
        </div>

        {/* Chat bubbles */}
        {CHAT_ITEMS.map((item, i) => (
          <ChatBubble key={i} item={item} inView={inView} />
        ))}

        {/* Stats row */}
        <div
          className="flex items-center gap-1 mt-3 pt-3 text-xs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(245,245,245,0.5)",
          }}
        >
          已练 23 句 · 今日 | 连续 7 天 🔥
        </div>
      </div>
    </div>
  )
}

/* ─── Chat bubble renderer ───────────────────────────────────── */
function ChatBubble({ item, inView }: { item: ChatItem; inView: boolean }) {
  const wrapStyle: React.CSSProperties = {
    opacity: 1,
    transform: inView ? "translateY(0)" : "translateY(8px)",
    transition: `transform 400ms ease-out ${item.delay}ms`,
  }

  if (item.kind === "ai") {
    return (
      <div className="flex flex-col self-start max-w-[85%]" style={wrapStyle}>
        <span
          className="text-xs mb-1"
          style={{ color: "rgba(245,245,245,0.5)" }}
        >
          AI
        </span>
        <div
          className="rounded-2xl rounded-tl-none px-4 py-2.5 text-sm"
          style={{ background: "#252525", color: "#F5F5F5" }}
        >
          {item.question}
          <div
            className="text-xs mt-0.5"
            style={{ color: "rgba(245,245,245,0.5)" }}
          >
            {item.sub}
          </div>
        </div>
      </div>
    )
  }

  if (item.kind === "wrong") {
    return (
      <div className="flex flex-col self-end max-w-[80%]" style={wrapStyle}>
        <span
          className="text-xs mb-1 text-right"
          style={{ color: "rgba(245,245,245,0.5)" }}
        >
          你
        </span>
        <div
          className="rounded-2xl rounded-tr-none px-4 py-2.5 text-sm"
          style={{
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "#F5F5F5",
          }}
        >
          <span className="line-through" style={{ color: "rgba(245,245,245,0.45)" }}>
            {item.text}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-xs mt-1"
          style={{ color: "#EF4444" }}
        >
          {item.hint}
        </div>
      </div>
    )
  }

  /* correct */
  return (
    <div className="flex flex-col self-end max-w-[80%]" style={wrapStyle}>
      <span
        className="text-xs mb-1 text-right"
        style={{ color: "rgba(245,245,245,0.5)" }}
      >
        你
      </span>
      <div
        className="rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-white"
        style={{ background: "#10B981" }}
      >
        {item.text}
      </div>
      <div
        className="flex items-center gap-1 text-xs mt-1"
        style={{ color: "rgba(255,255,255,0.80)" }}
      >
        {item.hint}
      </div>
    </div>
  )
}

/* ─── Right Column ───────────────────────────────────────────── */
function RightCopy({ inView }: { inView: boolean }) {
  const features: {
    icon: React.ReactNode
    title: string
    desc: string
  }[] = [
    {
      icon: <Eye size={16} color="#10B981" />,
      title: "图在，脑子不空白",
      desc: "不用想说什么，看图直接描述，最天然的开口方式。",
    },
    {
      icon: <Repeat size={16} color="#10B981" />,
      title: "AI 追着图问你三遍",
      desc: "同一个场景，被迫从不同角度说出来。这张图，你说透了。",
    },
    {
      icon: <Zap size={16} color="#10B981" />,
      title: "练完这张，下次自动开口",
      desc: "场景 → 英文反应，绕开中文翻译。这才是真正的流利。",
    },
  ]

  return (
    <div
      style={{
        opacity: 1,
        transform: inView ? "translateX(0)" : "translateX(24px)",
        transition: "transform 500ms ease-out 150ms",
      }}
    >
      {/* Badge */}
      <span
        className="px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5"
        style={{
          background: "rgba(16,185,129,0.10)",
          color: "#10B981",
        }}
      >
        ✦ {COPY.featureBadge}模式
      </span>

      {/* Heading */}
      <h2
        className="font-bold text-3xl md:text-4xl leading-tight mt-3 mb-4"
        style={{ color: "#F5F5F5" }}
      >
        看见了，就说得出
      </h2>

      {/* Subtext */}
      <p
        className="text-base leading-relaxed mb-6"
        style={{ color: "rgba(245,245,245,0.65)" }}
      >
        开口难，难在脑子里没画面。有图，脑子就有话说。
      </p>

      {/* Feature items */}
      <div className="flex flex-col gap-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* Icon box */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.10)" }}
            >
              {f.icon}
            </div>
            {/* Text */}
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "#F5F5F5" }}
              >
                {f.title}
              </p>
              <p
                className="text-sm leading-relaxed mt-0.5"
                style={{ color: "rgba(245,245,245,0.55)" }}
              >
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div
        className="flex items-center gap-2 mt-6 pt-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "#10B981" }}
        />
        <span
          className="text-xs"
          style={{ color: "rgba(245,245,245,0.4)" }}
        >
          配套教材图库 · 数百个真实场景 · 随课程解锁
        </span>
      </div>
    </div>
  )
}
