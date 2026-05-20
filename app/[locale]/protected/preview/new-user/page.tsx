import { getLocale } from "next-intl/server";
import { DashboardContent } from "@/components/dashboard-content";
import { DashboardPreviewBanner } from "@/components/dashboard-preview-banner";
import { newUserDashboardPreview } from "@/lib/dashboard-preview";

export default async function NewUserDashboardPreviewPage() {
  const locale = await getLocale();

  return (
    <>
      <DashboardPreviewBanner locale={locale} variant="new" />
      <DashboardContent {...newUserDashboardPreview(locale)} />
    </>
  );
}
