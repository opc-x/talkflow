import { redirect } from "next/navigation";

// TODO: read user_progress to resume from last position
export default function LearnIndexPage() {
  redirect("/protected/learn/1/1");
}
