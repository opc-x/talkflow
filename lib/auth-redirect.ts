import { routing } from "@/i18n/routing"

/** Post-auth redirect URL; must be listed in Supabase → Auth → URL Configuration. */
export function getAuthRedirectUrl(origin: string, path = "/protected"): string {
  const locale = routing.defaultLocale
  const normalized = path.startsWith("/") ? path : `/${path}`
  const withLocale = normalized.startsWith(`/${locale}/`)
    ? normalized
    : `/${locale}${normalized}`
  return `${origin.replace(/\/$/, "")}${withLocale}`
}
