import { createClient } from "@/lib/supabase/client"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function getAccessToken(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return "dev-bypass"
  }

  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 25_000
): Promise<T> {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new ApiError(
        typeof data.error === "string" ? data.error : `Request failed (${res.status})`,
        res.status
      )
    }

    return res.json() as Promise<T>
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        `口语服务超时（${timeoutMs / 1000}s）。请确认已运行 npm run dev:api`,
        408
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export { API_BASE }
