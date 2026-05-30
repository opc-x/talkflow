export function env(name: string, required = true): string {
  const value = process.env[name]?.trim()
  if (!value && required) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value ?? ""
}

export const serverConfig = {
  supabaseUrl: () => env("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () =>
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  openaiApiKey: () => process.env.OPENAI_API_KEY?.trim() ?? "",
  devBypassAuth: process.env.DEV_BYPASS_AUTH === "true",
  devUserId:
    process.env.DEV_USER_ID ?? "00000000-0000-0000-0000-000000000001",
}
