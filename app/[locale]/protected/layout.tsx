import Link from "next/link";
import { Mic, Flame, Settings, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";

async function getStreak(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("session_records")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return 0;

  const dates = [
    ...new Set(data.map((r) => r.created_at.slice(0, 10))),
  ].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(Date.now() - i * 86400000)
      .toISOString()
      .slice(0, 10);
    if (dates[i] === expected) streak++;
    else break;
  }
  return streak;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const streak = user ? await getStreak(user.id) : 0;
  const initials = (user?.email ?? "?")[0].toUpperCase();

  const navLinks = [
    { href: `/${locale}/protected/map`, label: "地图" },
    { href: `/${locale}/protected/learn`, label: "练习" },
    { href: `/${locale}/protected/review`, label: "复习" },
    { href: `/${locale}/protected/tools`, label: "工具" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}/protected`}
            className="flex items-center gap-1.5 font-bold text-lg text-primary shrink-0"
          >
            <Mic className="w-4 h-4" />
            TalkFlow
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right: streak + theme + avatar */}
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-full px-2.5 py-1 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                {streak}天
              </span>
            )}
            <ThemeSwitcher />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity outline-none">
                  {initials}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/protected/settings`} className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton variant="menu" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex-1 py-3 text-xs text-muted-foreground hover:text-foreground flex flex-col items-center gap-0.5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
