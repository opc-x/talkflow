import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { serverConfig } from "@/lib/server/config"

export type ApiAuthContext = {
  user: User
  supabase: SupabaseClient
  accessToken: string
}

export function createAnonClient(accessToken?: string): SupabaseClient {
  return createClient(serverConfig.supabaseUrl(), serverConfig.supabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

export function getDevUser(): User {
  return {
    id: serverConfig.devUserId,
    email: "dev@talkflow.local",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const supabase = createAnonClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export async function getApiAuthContext(request: Request): Promise<ApiAuthContext | Response> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""

  if (serverConfig.devBypassAuth && (!token || token === "dev-bypass")) {
    return {
      user: getDevUser(),
      accessToken: "dev-bypass",
      supabase: createAnonClient(),
    }
  }

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return {
    user,
    accessToken: token,
    supabase: createAnonClient(token),
  }
}

export function isAuthResponse(
  context: ApiAuthContext | Response
): context is Response {
  return context instanceof Response
}
