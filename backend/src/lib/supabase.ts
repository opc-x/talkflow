import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { config } from "../env.js"

export function createAnonClient(accessToken?: string): SupabaseClient {
  return createClient(config.supabaseUrl(), config.supabaseAnonKey(), {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const supabase = createAnonClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export function getDevUser(): User {
  return {
    id: config.devUserId,
    email: "dev@talkflow.local",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User
}

export function createUserClient(accessToken: string): SupabaseClient {
  return createAnonClient(accessToken)
}
