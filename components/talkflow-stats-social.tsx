"use client"

import { useRef, useState, useEffect } from "react"

// ─── Shared Hooks ────────────────────────────────────────────────────────────

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px", ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

function useCountUp(target: number, duration = 2000, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────
// INSERT between Hero section and DemoCard

const STATS = [
  {
    target: 12000,
    format: (n: number) => `${n.toLocaleString()}+`,
    label: "练习句数",
  },
  {
    target: 500,
    format: (n: number) => `${n}+`,
    label: "活跃学员",
  },
  {
    target: 15,
    format: (n: number) => `${n} 分钟`,
    label: "每日有效练习",
  },
] as const

function StatItem({
  target,
  format,
  label,
  active,
}: {
  target: number
  format: (n: number) => string
  label: string
  active: boolean
}) {
  const count = useCountUp(target, 2000, active)
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-2">
      <span
        className="font-bold text-3xl md:text-4xl tabular-nums"
        style={{ color: "#F5F5F5" }}
      >
        {format(count)}
      </span>
      <span
        className="text-xs mt-1"
        style={{ color: "rgba(245,245,245,0.5)" }}
      >
        {label}
      </span>
    </div>
  )
}

export function StatsBar() {
  const { ref, inView } = useInView({ threshold: 0.4 })

  return (
    <section
      ref={ref}
      className="py-12 px-4"
      style={{ backgroundColor: "#111111" }}
    >
      <div className="flex items-center justify-center max-w-2xl mx-auto">
        {STATS.map((stat, i) => (
          <div key={stat.label} className="flex items-center flex-1">
            {i !== 0 && (
              <div
                className="w-px h-10 flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              />
            )}
            <StatItem
              target={stat.target}
              format={stat.format}
              label={stat.label}
              active={inView}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── SocialProof ──────────────────────────────────────────────────────────────
// INSERT between ComparisonList section and FAQ section

interface Testimonial {
  avatar: string
  quote: string
  name: string
  tag: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    avatar: "张",
    quote: "练了两周，开会时突然发现自己直接说出来了，没有在脑子里翻译。",
    name: "张同学",
    tag: "上班族 · 练习 14 天",
  },
  {
    avatar: "L",
    quote: "之前背了好多单词，一开口还是卡。用了这个才明白，说话是要练嘴不是练眼。",
    name: "Lin Wei",
    tag: "留学生 · 练习 21 天",
  },
  {
    avatar: "王",
    quote: "AI 不会嘲笑你说错，但它真的会一直等你说对为止。这种压迫感才是有效的。",
    name: "王同学",
    tag: "准备雅思 · 练习 30 天",
  },
]

function TestimonialCard({
  testimonial,
  index,
  inView,
}: {
  testimonial: Testimonial
  index: number
  inView: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col rounded-2xl p-6"
      style={{
        backgroundColor: "#111111",
        border: `1px solid ${
          hovered ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"
        }`,
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.4)"
          : "0 0 0 rgba(0,0,0,0)",
        transform: hovered ? "translateY(-4px)" : "translateY(0px)",
        transition:
          "transform 300ms cubic-bezier(0.16,1,0.3,1), border-color 300ms cubic-bezier(0.16,1,0.3,1), box-shadow 300ms cubic-bezier(0.16,1,0.3,1), opacity 500ms ease",
        opacity: 1,
        transitionDelay: inView ? `${index * 100}ms` : "0ms",
      }}
    >
      <div
        aria-hidden="true"
        className="text-5xl leading-none mb-3 select-none"
        style={{ color: "#10B981" }}
      >
        &ldquo;
      </div>

      <p
        className="text-sm leading-relaxed mb-5 flex-1"
        style={{ color: "rgba(245,245,245,0.85)" }}
      >
        {testimonial.quote}
      </p>

      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: "#10B981", color: "#ffffff" }}
          aria-hidden="true"
        >
          {testimonial.avatar}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "#F5F5F5" }}
          >
            {testimonial.name}
          </p>
          <p
            className="text-xs truncate"
            style={{ color: "rgba(245,245,245,0.5)" }}
          >
            {testimonial.tag}
          </p>
        </div>
      </div>
    </article>
  )
}

export function SocialProof() {
  const { ref, inView } = useInView({ threshold: 0.15 })

  return (
    <section
      className="py-20 px-4"
      style={{ backgroundColor: "#1a1a1a" }}
      aria-label="学员反馈"
    >
      <div className="text-center mb-12">
        <h2
          className="font-bold text-2xl md:text-3xl text-balance"
          style={{ color: "#F5F5F5" }}
        >
          他们的变化
        </h2>
        <p
          className="text-sm mt-2"
          style={{ color: "rgba(245,245,245,0.5)" }}
        >
          真实学员，真实练习反馈
        </p>
      </div>

      <div
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
      >
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard
            key={t.name}
            testimonial={t}
            index={i}
            inView={inView}
          />
        ))}
      </div>
    </section>
  )
}
