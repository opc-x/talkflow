import type { Context, Next } from "hono"
import { config } from "../env.js"
import { createUserClient, getDevUser, getUserFromToken, createAnonClient } from "../lib/supabase.js"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export type AuthVariables = {
  user: User
  supabase: SupabaseClient
  accessToken: string
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""

  if (config.devBypassAuth && (!token || token === "dev-bypass")) {
    const user = getDevUser()
    c.set("user", user)
    c.set("accessToken", "dev-bypass")
    c.set("supabase", createAnonClient())
    await next()
    return
  }

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("user", user)
  c.set("accessToken", token)
  c.set("supabase", createUserClient(token))
  await next()
}
