"use client"

import { Mic, Zap, CheckCircle2, ImageIcon } from "lucide-react"
import { COPY } from "@/lib/copy"

/** 单人 + 笔记本场景，便于热区「laptop」叙事；本地图避免外链抖动 */
const SCENE_IMAGE = "/images/hero-scene-practice.jpg"

const FEATURES = [
  { icon: Zap, label: "AI 实时纠正", accent: true },
  { icon: Mic, label: "每天 15 分钟", accent: false },
  { icon: CheckCircle2, label: "脱口而出", accent: false },
] as const

export function HeroPracticePreview() {
  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] mx-auto lg:mx-0 lg:ml-auto">
      {/* 光晕：圆形扩散，避免 PC 端方框裁切感 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[90%] rounded-full pointer-events-none opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.35) 0%, transparent 68%)",
        }}
        aria-hidden
      />

      <div className="relative">
        {/* 手机外壳 */}
        <div
          className="relative rounded-[2.5rem] p-2 shadow-2xl"
          style={{
            background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 48px rgba(16, 185, 129, 0.12)",
          }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />

          <div className="rounded-[2rem] overflow-hidden bg-[#111111] flex flex-col">
            {/* 场景图 + 热区：对齐「看图说话」支柱 */}
            <div className="relative aspect-[4/3] sm:aspect-[5/4] w-full">
              <img
                src={SCENE_IMAGE}
                alt="英语场景练习示意"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
                }}
              />
              <span
                className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                style={{ background: "rgba(16,185,129,0.88)" }}
              >
                <ImageIcon className="w-3 h-3" aria-hidden />
                {COPY.featureBadge}
              </span>
              {/* 热区高亮 */}
              <div
                className="absolute rounded-lg border-2 border-[#FACC15] animate-pulse"
                style={{
                  left: "52%",
                  top: "48%",
                  width: "36%",
                  height: "30%",
                  boxShadow: "0 0 0 4px rgba(250,204,21,0.15)",
                }}
                aria-hidden
              />
              <span
                className="absolute text-[10px] font-medium text-[#FACC15] px-1.5 py-0.5 rounded"
                style={{
                  left: "52%",
                  top: "42%",
                  background: "rgba(0,0,0,0.55)",
                }}
              >
                laptop
              </span>
            </div>

            {/* 对话区：纠正贴在屏幕内，不再外挂方框 */}
            <div className="px-2.5 sm:px-3 pt-2 pb-3 sm:pt-2.5 sm:pb-3.5 flex flex-col gap-1.5 sm:gap-2 border-t border-white/5">
              <div className="flex flex-col items-start gap-0.5 max-w-[92%]">
                <span className="text-[10px] text-white/45">AI</span>
                <div
                  className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-[#F5F5F5] leading-snug"
                  style={{ background: "#252525" }}
                >
                  What is the woman doing?
                  <span className="block text-[10px] text-white/45 mt-0.5">
                    她在做什么？
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 self-end max-w-[88%]">
                <span className="text-[10px] text-white/45">你</span>
                <div
                  className="rounded-2xl rounded-tr-sm px-3 py-2 text-xs leading-snug"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.22)",
                    color: "rgba(245,245,245,0.55)",
                  }}
                >
                  <span className="line-through">She study with laptop.</span>
                </div>
              </div>

              {/* 纠正条：与手机一体，带左侧强调线 */}
              <div
                className="flex items-start gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.28)",
                }}
              >
                <Zap
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: "#FACC15", fill: "#FACC15" }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-primary leading-none mb-1">
                    AI 实时纠正
                  </p>
                  <p className="text-xs text-[#F5F5F5] leading-snug">
                    She is studying with her laptop.
                  </p>
                  <p className="text-[10px] text-primary/80 mt-1">✓ 说对了，继续</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 特性条：PC/移动统一在手机下方，和文案区对齐 */}
      <ul className="relative z-10 mt-3 sm:mt-4 lg:mt-5 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
        {FEATURES.map(({ icon: Icon, label, accent }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            style={{
              background: accent ? "rgba(16,185,129,0.10)" : "#1f1f1f",
              border: accent
                ? "1px solid rgba(16,185,129,0.28)"
                : "1px solid rgba(255,255,255,0.08)",
              color: accent ? "#10B981" : "rgba(245,245,245,0.75)",
            }}
          >
            <Icon
              className="w-3 h-3 shrink-0"
              style={accent ? { color: "#FACC15", fill: "#FACC15" } : undefined}
              aria-hidden
            />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
