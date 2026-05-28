"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Mic, RotateCcw, User } from "lucide-react"
import { COPY } from "@/lib/copy"

interface ProtectedBottomNavProps {
  locale: string
  micHref: string
  reviewCount: number
}

function isActive(pathname: string, suffix: string) {
  return pathname === suffix || pathname.endsWith(suffix)
}

export function ProtectedBottomNav({
  locale,
  micHref,
  reviewCount,
}: ProtectedBottomNavProps) {
  const pathname = usePathname()
  const homeHref = `/${locale}/protected`
  const reviewHref = `/${locale}/protected/review`
  const meHref = `/${locale}/protected/me`

  const homeActive = isActive(pathname, homeHref) || pathname.endsWith("/protected")
  const reviewActive = pathname.includes("/protected/review")
  const meActive = pathname.includes("/protected/me")

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="主导航"
    >
      <div className="relative mx-auto flex h-16 max-w-[430px] items-stretch px-1">
        <Link
          href={homeHref}
          className={`z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
            homeActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className="text-xs leading-none">首页</span>
        </Link>

        <div className="relative w-[4.5rem] shrink-0 pointer-events-none">
          <Link
            href={micHref}
            aria-label={COPY.navPracticeLabel}
            className="pointer-events-auto absolute left-1/2 top-0 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-5 animate-breathe items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--background)),0_0_24px_rgba(16,185,129,0.6)] transition-colors hover:bg-primary/90"
          >
            <Mic className="h-6 w-6" />
          </Link>
        </div>

        <div className="flex min-w-0 flex-1">
          <Link
            href={reviewHref}
            className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              reviewActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative flex h-5 w-5 items-center justify-center">
              <RotateCcw className="h-5 w-5 shrink-0" />
              {reviewCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {reviewCount > 99 ? "99+" : reviewCount}
                </span>
              )}
            </div>
            <span className="text-xs leading-none">复习</span>
          </Link>

          <Link
            href={meHref}
            className={`z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              meActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-5 w-5 shrink-0" />
            <span className="text-xs leading-none">我的</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
