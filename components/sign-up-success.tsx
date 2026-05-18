"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";

const COLORS = {
  bg: "#111111",
  card: "#1a1a1a",
  accent: "#10B981",
  textHigh: "#F5F5F5",
  textMuted: "rgba(245,245,245,0.5)",
  textVeryMuted: "rgba(136,136,136,0.5)",
  border: "rgba(255,255,255,0.08)",
  panelBorder: "rgba(255,255,255,0.06)",
  accentBg: "rgba(16,185,129,0.15)",
  accentBgSoft: "rgba(16,185,129,0.06)",
  accentBorder: "rgba(16,185,129,0.25)",
  accentBorderSoft: "rgba(16,185,129,0.15)",
  textBody: "rgba(245,245,245,0.75)",
  textSub: "rgba(245,245,245,0.6)",
} as const;

const steps: { num: number; title: string; sub: string; delay: number }[] = [
  {
    num: 1,
    title: "确认邮件",
    sub: "点击邮件中的链接激活账户",
    delay: 300,
  },
  {
    num: 2,
    title: "选择起点",
    sub: "2 分钟告诉我们你的英语程度",
    delay: 400,
  },
  {
    num: 3,
    title: "开始第一课",
    sub: "每天 15 分钟，AI 陪练",
    delay: 500,
  },
];

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: COLORS.accentBg }}
        aria-hidden="true"
      >
        {/* Mic icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
      <span
        className="font-bold text-2xl"
        style={{ color: COLORS.textHigh }}
      >
        TalkFlow
      </span>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 py-12"
      style={{ borderRight: `1px solid ${COLORS.panelBorder}` }}
    >
      {/* Top: Logo */}
      <LogoMark />

      {/* Middle: Hero copy + steps */}
      <div>
        <h1
          className="font-bold leading-tight"
          style={{
            fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
            color: COLORS.textHigh,
          }}
        >
          马上就好
          <br />
          <span style={{ color: COLORS.accent }}>三步开始练习</span>
        </h1>

        <p
          className="text-lg mt-4 max-w-xs"
          style={{ color: COLORS.textSub }}
        >
          大多数邮件在 1 分钟内送达。
        </p>

        {/* 3-step list */}
        <div className="mt-6 flex flex-col gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 animate-trust-in"
              style={{
                opacity: 0,
                animationDelay: `${step.delay}ms`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: COLORS.accent,
                  color: "#fff",
                  marginTop: "1px",
                }}
                aria-hidden="true"
              >
                {step.num}
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: COLORS.textHigh }}
                >
                  {step.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: COLORS.textMuted }}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: tagline */}
      <p className="text-xs" style={{ color: COLORS.textVeryMuted }}>
        由语言教练设计 · 经系统训练方法验证
      </p>
    </div>
  );
}

function ConfirmationCard() {
  const [resent, setResent] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [resendHovered, setResendHovered] = useState(false);

  function handleResend() {
    if (resent) return;
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl p-8 animate-form-card-in"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        opacity: 0,
      }}
    >
      {/* Success icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: "rgba(16,185,129,0.12)",
          border: `1px solid ${COLORS.accentBorder}`,
        }}
        aria-hidden="true"
      >
        <Mail size={32} style={{ color: COLORS.accent }} />
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2
          className="font-bold text-2xl mb-1.5"
          style={{ color: COLORS.textHigh }}
        >
          确认邮件已发送
        </h2>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          请查收你的收件箱
        </p>
      </div>

      {/* Info box */}
      <div
        className="mt-5 mb-6 rounded-xl px-5 py-4"
        style={{
          background: COLORS.accentBgSoft,
          border: `1px solid ${COLORS.accentBorderSoft}`,
        }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: COLORS.textBody }}
        >
          点击邮件中的确认链接，即可激活账户并开始你的第一课。
        </p>
      </div>

      {/* Primary CTA */}
      <button
        className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200"
        style={{
          background: COLORS.accent,
          color: "#fff",
          boxShadow: ctaHovered
            ? "0 0 12px rgba(16,185,129,0.25)"
            : "none",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => window.open("https://mail.google.com", "_blank")}
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => setCtaHovered(false)}
        aria-label="在新标签页中打开 Gmail 收件箱"
      >
        去收件箱查看 →
      </button>

      {/* Resend row */}
      <div className="mt-4 text-center">
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          没有收到邮件？{" "}
        </span>
        <button
          className="text-sm transition-opacity duration-150"
          style={{
            color: COLORS.accent,
            opacity: resendHovered ? 0.8 : 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={handleResend}
          onMouseEnter={() => setResendHovered(true)}
          onMouseLeave={() => setResendHovered(false)}
          aria-live="polite"
        >
          {resent ? "已重新发送 ✓" : "重新发送"}
        </button>
        <p
          className="text-xs mt-1"
          style={{ color: COLORS.textVeryMuted }}
        >
          检查垃圾邮件文件夹
        </p>
      </div>

      {/* Divider */}
      <div
        className="mt-6 h-px"
        style={{ background: "rgba(255,255,255,0.06)" }}
        role="separator"
        aria-hidden="true"
      />

      {/* Footer link */}
      <div className="mt-4 text-center">
        <span className="text-sm" style={{ color: COLORS.textMuted }}>
          已激活账户？{" "}
        </span>
        <Link
          href="/zh/auth/login"
          className="text-sm font-medium transition-opacity duration-150 hover:opacity-80"
          style={{ color: COLORS.accent }}
        >
          直接登录
        </Link>
        <p
          className="text-xs mt-3 italic"
          style={{ color: COLORS.textVeryMuted }}
        >
          你已完成了最难的一步：决定开口练习。
        </p>
      </div>
    </div>
  );
}

export function SignUpSuccess() {
  return (
    <>
      <style>{`
        @keyframes form-card-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes trust-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-form-card-in {
          animation: form-card-in 400ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .animate-trust-in {
          animation: trust-in 400ms cubic-bezier(0.16,1,0.3,1) forwards;
        }
      `}</style>

      <div
        className="min-h-screen font-sans grid lg:grid-cols-2"
        style={{ background: COLORS.bg }}
      >
        {/* Left: Brand panel */}
        <BrandPanel />

        {/* Right: Confirmation panel */}
        <div
          className="flex flex-col items-center justify-center px-5 py-12 sm:px-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <LogoMark />
          </div>

          {/* Card */}
          <ConfirmationCard />

          {/* Page footer */}
          <p
            className="mt-8 text-xs text-center"
            style={{ color: COLORS.textVeryMuted }}
          >
            © 2026 TalkFlow · 脱口而出，靠练不靠背
          </p>
        </div>
      </div>
    </>
  );
}

export default function SignUpSuccessPage() {
  return <SignUpSuccess />;
}
