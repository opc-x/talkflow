"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignUpForm } from "@/components/sign-up-form";
import { translateAuthError, isConfirmEmailEnabled } from "@/lib/auth-errors";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";

export default function Page() {
  const router = useRouter();

  async function handleSignUp({
    email,
    password,
  }: {
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    const supabase = createClient();
    const trimmedEmail = email.trim().toLowerCase();
    const confirmEmail = isConfirmEmailEnabled();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      // 关闭 Confirm email 时不要传 emailRedirectTo，避免走发信链路、触发限流
      ...(confirmEmail
        ? {
            options: {
              emailRedirectTo: getAuthRedirectUrl(window.location.origin),
            },
          }
        : {}),
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[signUp]", {
          code: error.code,
          status: error.status,
          message: error.message,
        });
      }
      throw new Error(translateAuthError(error));
    }

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

    if (data.session) {
      router.push("/zh/protected");
      router.refresh();
      return;
    }

    if (confirmEmail) {
      router.push("/zh/auth/sign-up-success");
      return;
    }

    // Confirm 已关但仍无 session：多为限流或账号已存在但未登录
    throw new Error(
      "注册未完成。若刚连续试过多次，请等几分钟再试；若邮箱已注册，请直接登录。"
    );
  }

  return <SignUpForm locale="zh" onSubmit={handleSignUp} />;
}
