import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/protected"
              className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="w-5 h-5 text-primary" />
              TalkFlow
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                href="/protected/learn"
                className="hover:text-foreground transition-colors"
              >
                学习
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {user && <LogoutButton />}
          </div>
        </div>
      </nav>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
