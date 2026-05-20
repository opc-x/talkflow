import Link from "next/link";

interface DashboardPreviewBannerProps {
  locale: string;
  variant: "new" | "returning";
}

export function DashboardPreviewBanner({
  locale,
  variant,
}: DashboardPreviewBannerProps) {
  const base = `/${locale}/protected/preview`;
  const label = variant === "new" ? "新用户首页" : "老用户首页";

  return (
    <div className="sticky top-14 z-20 border-b border-amber-500/40 bg-amber-500 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-[430px] flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">预览 · {label}</span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <Link
            href={`${base}/new-user`}
            className={
              variant === "new"
                ? "rounded-md bg-amber-950 px-2 py-1 text-amber-100"
                : "underline underline-offset-2"
            }
          >
            新用户
          </Link>
          <Link
            href={`${base}/returning-user`}
            className={
              variant === "returning"
                ? "rounded-md bg-amber-950 px-2 py-1 text-amber-100"
                : "underline underline-offset-2"
            }
          >
            老用户
          </Link>
          <Link href={`/${locale}/protected`} className="underline underline-offset-2">
            真实首页
          </Link>
        </div>
      </div>
    </div>
  );
}
