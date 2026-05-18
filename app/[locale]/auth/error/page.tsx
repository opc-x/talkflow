import { Suspense } from "react";
import Link from "next/link";
import { Mic, AlertCircle } from "lucide-react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  return (
    <p className="text-sm leading-relaxed" style={{ color: "rgba(245,245,245,0.55)" }}>
      {params?.error ? `错误代码：${params.error}` : "发生了未知错误，请稍后重试。"}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#111111" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
          >
            <Mic className="w-4 h-4" style={{ color: "#10B981" }} />
          </div>
          <span className="font-bold text-xl" style={{ color: "#F5F5F5" }}>
            TalkFlow
          </span>
        </div>

        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "rgba(239,68,68,0.10)" }}
          >
            <AlertCircle className="w-7 h-7" style={{ color: "#EF4444" }} />
          </div>

          <h2 className="font-bold text-xl mb-2" style={{ color: "#F5F5F5" }}>
            出了点问题
          </h2>

          <Suspense
            fallback={
              <p className="text-sm" style={{ color: "rgba(245,245,245,0.55)" }}>
                加载中…
              </p>
            }
          >
            <ErrorContent searchParams={searchParams} />
          </Suspense>

          <div className="flex flex-col gap-2 mt-6">
            <Link
              href="/auth/login"
              className="inline-block w-full h-11 rounded-xl text-sm font-semibold leading-[44px]"
              style={{ backgroundColor: "#10B981", color: "#ffffff" }}
            >
              返回登录
            </Link>
            <Link
              href="/"
              className="text-sm"
              style={{ color: "rgba(245,245,245,0.4)" }}
            >
              回到首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
