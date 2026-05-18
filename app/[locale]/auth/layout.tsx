import Link from "next/link";
import { Mic, CheckCircle2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#111111" }}>
      {/* Left side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
            >
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-2xl" style={{ color: "#F5F5F5" }}>
              TalkFlow
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h1
                className="text-4xl font-bold leading-tight"
                style={{ color: "#F5F5F5" }}
              >
                脱口而出
              </h1>
              <h1 className="text-4xl font-bold leading-tight text-primary">
                靠练不靠背
              </h1>
            </div>
            <p className="text-lg leading-relaxed max-w-md" style={{ color: "rgba(245,245,245,0.6)" }}>
              每天 15 分钟，AI 问你答，说错立刻纠，练到不假思索说出来为止。
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {["强迫开口输出", "即时纠正反馈", "系统化课程"].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm" style={{ color: "rgba(245,245,245,0.7)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(136,136,136,0.5)" }}>
            由语言教练设计 · 经系统训练方法验证
          </p>
        </div>

        {/* Subtle vertical divider */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        />
      </div>

      {/* Right side - Form */}
      <div
        className="w-full lg:w-1/2 flex flex-col"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
            >
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl" style={{ color: "#F5F5F5" }}>
              TalkFlow
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div
            className="w-full max-w-sm rounded-2xl border p-8"
            style={{
              backgroundColor: "#1a1a1a",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            {children}
          </div>
        </div>

        <footer className="p-6 text-center text-xs" style={{ color: "rgba(136,136,136,0.5)" }}>
          <p>© 2026 TalkFlow · 脱口而出，靠练不靠背</p>
        </footer>
      </div>
    </div>
  );
}
