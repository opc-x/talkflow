"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/login-form";
import { translateAuthError } from "@/lib/auth-errors";

export default function Page() {
  const router = useRouter();

  async function handleLogin({ email, password }: { email: string; password: string }) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(translateAuthError(error));
    router.push("/zh/protected");
    router.refresh();
  }

  return <LoginForm locale="zh" onSubmit={handleLogin} />;
}
