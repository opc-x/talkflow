import { Hero } from "@/components/hero";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  return <Hero locale={locale} />;
}
