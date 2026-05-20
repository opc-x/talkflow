"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  const router = useRouter();

  async function handleSignUp({ email, password }: { email: string; password: string; confirmPassword: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/protected` },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from("user_progress").upsert(
        {
          user_id: data.user.id,
          lessons_done: [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    router.push("/auth/sign-up-success");
  }

  return <SignUpForm onSubmit={handleSignUp} />;
}
