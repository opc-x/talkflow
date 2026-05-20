export function env(name: string, required = true): string {
  const value = process.env[name]?.trim()
  if (!value && required) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value ?? ""
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  supabaseUrl: () => env("SUPABASE_URL"),
  supabaseAnonKey: () => env("SUPABASE_ANON_KEY"),
  openaiApiKey: () => process.env.OPENAI_API_KEY?.trim() ?? "",
  devBypassAuth: process.env.DEV_BYPASS_AUTH === "true",
  devUserId: process.env.DEV_USER_ID ?? "00000000-0000-0000-0000-000000000001",
}
