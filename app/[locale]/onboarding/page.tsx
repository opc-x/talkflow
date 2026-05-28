import Link from "next/link"
import { setStartingLevel } from "./actions"

const LEVELS = [
  {
    emoji: "🌱",
    title: "完全零基础",
    subtitle: "从最基础的句型开始",
    lessonNum: 1,
  },
  {
    emoji: "💬",
    title: "能应付日常对话",
    subtitle: "打招呼、买东西、问路",
    lessonNum: 25,
  },
  {
    emoji: "💼",
    title: "职场/工作英语",
    subtitle: "开会、邮件、汇报",
    lessonNum: 78,
  },
  {
    emoji: "🎯",
    title: "进阶/流利表达",
    subtitle: "复杂观点、地道用法",
    lessonNum: 127,
  },
] as const

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%), #111111",
        color: "#F5F5F5",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          选择你的英语起点
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(245,245,245,0.65)",
            textAlign: "center",
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          不用担心选错，随时可以在「我」页面重新测级
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LEVELS.map((level) => (
            <form
              key={level.lessonNum}
              action={setStartingLevel.bind(null, level.lessonNum, locale)}
            >
              <button
                type="submit"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#1a1a1a",
                  color: "#F5F5F5",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{level.emoji}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                      {level.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(245,245,245,0.6)",
                      }}
                    >
                      {level.subtitle}
                    </div>
                  </div>
                </div>
              </button>
            </form>
          ))}
        </div>

        <p
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 13,
            color: "rgba(245,245,245,0.5)",
          }}
        >
          想精准定位？{" "}
          <Link
            href={`/${locale}/onboarding/assessment`}
            style={{ color: "#10B981", textDecoration: "none" }}
          >
            口语测评
          </Link>
        </p>
      </div>
    </div>
  )
}
