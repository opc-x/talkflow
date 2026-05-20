"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Mic, RotateCcw, User } from "lucide-react"

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="relative mx-auto flex h-16 max-w-[430px] items-center justify-around px-4">
        <Link
          href={homeHref}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
            homeActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">首页</span>
        </Link>

        <div className="flex-1" />

        <Link
          href={micHref}
          aria-label="开口练习"
          className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-5 animate-breathe items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--background)),0_0_24px_rgba(16,185,129,0.6)] transition-colors hover:bg-primary/90"
        >
          <Mic className="h-6 w-6" />
        </Link>

        <Link
          href={reviewHref}
          className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
            reviewActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="relative">
            <RotateCcw className="h-5 w-5" />
            {reviewCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {reviewCount > 99 ? "99+" : reviewCount}
              </span>
            )}
          </div>
          <span className="text-xs">复习</span>
        </Link>

        <Link
          href={meHref}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
            meActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">我的</span>
        </Link>
      </div>
    </div>
  )
}
