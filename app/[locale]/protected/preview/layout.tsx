import { redirect } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardPreviewLayout({ children, params }: Props) {
  const { locale } = await params;

  const devOnly =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

  if (!devOnly) {
    redirect(`/${locale}/protected`);
  }

  return children;
}
