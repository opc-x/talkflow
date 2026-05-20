import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function DashboardPreviewHubPage() {
  const locale = await getLocale();
  const base = `/${locale}/protected/preview`;

  return (
    <main className="mx-auto min-h-full w-full max-w-[430px] px-4 py-8 pb-28">
      <h1 className="text-xl font-semibold text-foreground">首页预览</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        开发专用：新/老用户各一页，不用刷数据库、不用走完 onboarding。
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Link
          href={`${base}/new-user`}
          className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <p className="text-lg font-semibold text-foreground">新用户首页</p>
          <p className="mt-1 text-sm text-muted-foreground">
            大场景图 +「开始体验 →」，无进度条进度
          </p>
        </Link>

        <Link
          href={`${base}/returning-user`}
          className="block rounded-2xl border border-[#10B981]/40 bg-[#10B981]/5 p-5 transition-colors hover:border-[#10B981]"
        >
          <p className="text-lg font-semibold text-[#10B981]">老用户首页</p>
          <p className="mt-1 text-sm text-muted-foreground">
            场景图 + 绿色「开口练习 / 进入场景 →」
          </p>
        </Link>

        <Link
          href={`/${locale}/protected`}
          className="text-center text-sm text-muted-foreground underline underline-offset-2"
        >
          返回真实首页（跟当前账号进度走）
        </Link>
      </div>
    </main>
  );
}
