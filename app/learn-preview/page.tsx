import { redirect } from "next/navigation";

/** Legacy path → locale preview (Playwright / dev tools) */
export default function LearnPreviewRedirect() {
  redirect("/zh/learn-preview");
}
