import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("current_lesson_id")
    .eq("user_id", user.id)
    .single();

  if (progress?.current_lesson_id) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("book_num, lesson_num")
      .eq("id", progress.current_lesson_id)
      .single();

    if (lesson) {
      redirect(`/protected/learn/${lesson.book_num}/${lesson.lesson_num}`);
    }
  }

  redirect("/protected/learn/1/1");
}
