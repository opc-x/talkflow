import { getLocale } from "next-intl/server";
import { DashboardContent } from "@/components/dashboard-content";
import { DashboardPreviewBanner } from "@/components/dashboard-preview-banner";
import { returningUserDashboardPreview } from "@/lib/dashboard-preview";

export default async function ReturningUserDashboardPreviewPage() {
  const locale = await getLocale();

  return (
    <>
      <DashboardPreviewBanner locale={locale} variant="returning" />
      <DashboardContent {...returningUserDashboardPreview(locale, null)} />
    </>
  );
}
