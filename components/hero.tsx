"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Mic,
  Zap,
  CheckCircle2,
  ArrowRight,
  Check,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsBar, SocialProof } from "@/components/talkflow-stats-social"
import { LandingDemo } from "@/components/landing-demo"
import { HeroPracticePreview } from "@/components/hero-practice-preview"

// ─── Scroll-reveal hook ──────────────────────────────────────────────────────
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, { threshold: 0.15, ...options })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}
    >
      {children}
    </div>
  )
}


// ─── Props ───────────────────────────────────────────────────────────────────
interface HeroProps {
  locale: string
}

export function Hero({ locale }: HeroProps) {
  const signUpHref = `/${locale}/auth/sign-up`
  const loginHref  = `/${locale}/auth/login`

  return (
    <div className="dark min-h-screen font-sans" style={{ backgroundColor: "#111111" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 border-b border-border flex items-center px-4 sm:px-6" style={{ backgroundColor: "#111111" }}>
        <div className="flex items-center gap-2 flex-1">
          <Mic className="w-4 h-4 text-primary" />
          <span className="font-bold text-lg text-foreground">TalkFlow</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={loginHref} className="text-sm">登录</Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            asChild
          >
            <Link href={signUpHref}>免费开始</Link>
          </Button>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <Section>
        <section className="relative overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
            />
            <div 
              className="absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl opacity-15"
              style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
            />
          </div>

          <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 md:pt-20 md:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-12 items-center">
              {/* Left: Text content */}
              <div className="text-center lg:text-left flex flex-col items-center lg:items-start gap-3 sm:gap-4 lg:gap-5">
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: "rgba(16,185,129,0.10)", color: "#10B981" }}>
                  <Zap
                    className="w-3 h-3 shrink-0"
                    style={{ color: "#FACC15", fill: "#FACC15" }}
                    aria-hidden
                  />
                  AI 问，你答，说对为止
                </span>

                {/* Headline */}
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance">
                    脱口而出
                  </h1>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-tight text-balance">
                    靠练不靠背
                  </h1>
                </div>

                {/* Sub-copy */}
                <div className="flex flex-col gap-1 text-base leading-relaxed">
                  <p className="text-muted-foreground">学了多年英语，一开口还是卡？</p>
                  <p className="font-medium text-foreground">不是你笨——是从来没人逼你张嘴练到自动反应。</p>
                </div>

                <p className="hidden sm:block text-sm text-muted-foreground leading-relaxed max-w-md">
                  TalkFlow 的 AI 每天快速发问，你必须开口回答，说错立刻纠正，反复到不假思索说出来为止。
                </p>

                {/* CTA */}
                <div className="flex flex-col items-center lg:items-start gap-2 w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 animate-breathe"
                    asChild
                  >
                    <Link href={signUpHref}>开始练习，免费 →</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">免费开始，不需要信用卡</p>
                </div>

                {/* Feature pills — 移动端由手机预览下方展示，避免重复占高 */}
                <div className="hidden lg:flex flex-wrap justify-center lg:justify-start gap-2">
                  {["强迫开口输出", "实时纠正反馈", "系统化课程", "无需外教"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                      style={{ backgroundColor: "#1f1f1f" }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                      {label}
                    </span>
                  ))}
                </div>

                <p className="hidden sm:block text-xs" style={{ color: "rgba(136,136,136,0.5)" }}>
                  由语言教练设计 · 经系统验证
                </p>
              </div>

              {/* Right: 产品预览（场景图 + 屏内纠正，与下方 LandingDemo 同一叙事） */}
              <div className="relative flex justify-center lg:justify-end w-full -mt-1 sm:mt-0">
                <HeroPracticePreview />
              </div>
            </div>
          </div>
        </section>
      </Section>

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <StatsBar />

      {/* ── LANDING DEMO ────────────────────────────────────────────────── */}
      <LandingDemo />

      {/* ── PAIN POINTS ─────────────────────────────────────────────────── */}
      <Section>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
              你不是没天赋，你只是从没被逼过
            </h2>
            <p className="font-medium text-foreground mb-10">
              不是你不努力，是那些方法从来没有强迫你张嘴。
            </p>

            <div className="flex flex-col gap-4">
              {[
                { wrong: "背够多单词就能说话", right: "开口是肌肉，不练不会动" },
                { wrong: "多听就能开口",       right: "输入 ≠ 输出，听懂 ≠ 说得出" },
                { wrong: "学了语法就能组句子", right: "规则在脑子里，嘴还是跟不上" },
              ].map(({ wrong, right }, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div
                    className="rounded-xl px-4 py-3 text-sm text-muted-foreground line-through text-left"
                    style={{ backgroundColor: "rgba(31,31,31,0.5)" }}
                  >
                    {wrong}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  <div
                    className="rounded-xl border px-4 py-3 text-sm text-foreground font-medium text-left"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.08)",
                      borderColor: "rgba(16,185,129,0.20)"
                    }}
                  >
                    {right}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mt-10">
              口语是条件反射。条件反射靠训练，不靠理解。
            </p>
          </div>
        </section>
      </Section>

      {/* ── MECHANISM CARDS ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#1a1a1a" }} className="py-20 px-4">
        <Section>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
                口语流利的真相
              </h2>
              <p className="text-muted-foreground text-sm">
                外教贵、时间少、开不了口——三个问题一次解决
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: "🎯",
                  title: "强迫输出",
                  desc: "AI 快速发问，你必须张嘴。没有选项，沉默 3 秒就再问一遍。",
                },
                {
                  icon: "⚡️",
                  title: "说错立刻纠",
                  desc: "当场指出，当场重练。不是练完给评分，是说错了立刻再说。",
                },
                {
                  icon: "🔁",
                  title: "重复到自动",
                  desc: "同一句话反复出现，直到不假思索说对。肌肉记忆。",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border p-6 flex flex-col gap-3"
                  style={{ backgroundColor: "#111111" }}
                >
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────────────────────── */}
      <Section>
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8 text-balance">
              为什么不是背单词 App？
            </h2>

            <ComparisonList />
          </div>
        </section>
      </Section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────── */}
      <SocialProof />

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <Section>
        <section className="py-20 px-4" id="pricing">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
                选择适合你的计划
              </h2>
              <p className="text-muted-foreground text-sm">
                从免费开始，随时升级
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 免费 */}
              <div
                className="rounded-2xl border border-border p-6 flex flex-col"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="text-sm text-muted-foreground mb-2">免费</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">0</span>
                  <span className="text-muted-foreground">元</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  入门 24 课，体验完整学习流程
                </p>
                <ul className="flex flex-col gap-3 mb-6 flex-1">
                  {["入门阶段 24 课", "AI 实时纠错", "基础复习系统"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href={signUpHref}>免费开始</Link>
                </Button>
              </div>

              {/* 日常对话 - 推荐 */}
              <div
                className="rounded-2xl border-2 p-6 flex flex-col relative"
                style={{ 
                  backgroundColor: "rgba(16,185,129,0.05)",
                  borderColor: "rgba(16,185,129,0.40)"
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" />
                  推荐
                </div>
                <div className="text-sm text-primary mb-2">日常对话</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">28</span>
                  <span className="text-muted-foreground">元/月</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  适合日常交流，覆盖生活场景
                </p>
                <ul className="flex flex-col gap-3 mb-6 flex-1">
                  {["全部日常对话课程", "AI 实时纠错", "完整复习系统", "学习数据分析"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href={signUpHref}>选择此计划</Link>
                </Button>
              </div>

              {/* 完整精通 */}
              <div
                className="rounded-2xl border border-border p-6 flex flex-col"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="text-sm text-muted-foreground mb-2">完整精通</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">48</span>
                  <span className="text-muted-foreground">元/月</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  191 课完整体系，四个阶段一路练到流利
                </p>
                <ul className="flex flex-col gap-3 mb-6 flex-1">
                  {["全部 191 课内容", "职场流利 + 高级表达", "AI 实时纠错", "完整复习系统", "学习数据分析", "优先客服支持"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href={signUpHref}>选择此计划</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#1a1a1a" }} className="py-20 px-4">
        <Section>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              你可能想问
            </h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  q: "需要什么英语基础？",
                  a: "能看懂英文句子、说过简单对话就够了。完全零基础不适合，已经流利的也不需要。",
                },
                {
                  q: "和普通 AI 聊天有什么区别？",
                  a: "普通 AI 你可以不开口、用中文、说错没人管。TalkFlow 不行——AI 会一直等你说对为止。",
                },
                {
                  q: "每天需要练多久？",
                  a: "15 分钟就够。关键是每天开口，不是一次练很久。",
                },
                {
                  q: "免费能用什么？",
                  a: "前几课完全免费，注册即可，不需要信用卡。",
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-2xl border border-border px-6 py-5"
                  style={{ backgroundColor: "#111111" }}
                >
                  <p className="font-semibold text-sm text-foreground mb-2">{q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#10B981" }} className="py-20 px-4 text-center">
        <Section>
          <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-3xl font-bold text-primary-foreground text-balance">
              开口，就现在。
            </h2>
            <p className="text-primary-foreground/75 mb-4">
              每天 15 分钟，AI 陪你练到脱口而出。
            </p>
            <Button
              size="lg"
              className="h-12 px-8 font-semibold animate-breathe"
              style={{
                backgroundColor: "#ffffff",
                color: "#10B981",
              }}
              asChild
            >
              <Link href={signUpHref}>免费开始练习 →</Link>
            </Button>
          </div>
        </Section>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">TalkFlow</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © 2026 TalkFlow · 脱口而出，靠练不靠背
          </p>
        </div>
      </footer>
    </div>
  )
}

// ─── Comparison list (delayed reveal for TalkFlow row) ───────────────────────
function ComparisonList() {
  const items = [
    {
      isTalkFlow: false,
      icon: "✗",
      title: "背单词 App",
      desc: "认识单词 ≠ 能开口说",
    },
    {
      isTalkFlow: false,
      icon: "✗",
      title: "AI 聊天机器人",
      desc: "随便聊不纠错，是娱乐不是练习",
    },
    {
      isTalkFlow: false,
      icon: "✗",
      title: "线下外教",
      desc: "每小时几百元，排班难",
    },
    {
      isTalkFlow: true,
      icon: "✓",
      title: "TalkFlow",
      desc: "强制输出 + 即时纠正 + 系统课程",
    },
  ]

  const { ref, inView } = useInView()

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {items.map(({ isTalkFlow, icon, title, desc }, i) => (
        <div
          key={title}
          className={`
            rounded-xl px-5 py-3.5 flex items-center gap-3
            transition-all duration-500 ease-out
            ${inView
              ? isTalkFlow
                ? "opacity-100 translate-y-0"
                : "opacity-60 translate-y-0"
              : "opacity-0 translate-y-3"
            }
          `}
          style={{
            transitionDelay: inView
              ? isTalkFlow ? "600ms" : `${i * 80}ms`
              : "0ms",
            ...(isTalkFlow
              ? {
                  border: "1px solid rgba(16,185,129,0.40)",
                  backgroundColor: "rgba(16,185,129,0.05)",
                  boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                }
              : {
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(31,31,31,0.30)",
                }),
          }}
        >
          <span
            className={`text-sm font-bold shrink-0 ${isTalkFlow ? "text-primary" : "text-muted-foreground"}`}
          >
            {icon}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <span
              className={`text-sm font-medium shrink-0 ${isTalkFlow ? "text-primary" : "text-muted-foreground line-through"}`}
            >
              {title}
            </span>
            <span className="hidden sm:inline text-muted-foreground">/</span>
            <span
              className={`text-sm ${isTalkFlow ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {desc}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
