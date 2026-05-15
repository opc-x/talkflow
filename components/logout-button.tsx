"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ variant }: { variant?: "menu" | "button" }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (variant === "menu") {
    return (
      <button
        onClick={logout}
        className="flex items-center gap-2 w-full text-sm text-destructive px-2 py-1.5 rounded-sm hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>
    );
  }

  return (
    <Button variant="outline" onClick={logout}>
      退出登录
    </Button>
  );
}
