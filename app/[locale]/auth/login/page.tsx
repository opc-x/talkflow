"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  const router = useRouter();

  async function handleLogin({ email, password }: { email: string; password: string }) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    router.push("/protected");
  }

  return <LoginForm onSubmit={handleLogin} />;
}
