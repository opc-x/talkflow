/** Client + server: show dev auth shortcuts (never enable in production builds intentionally). */
export function isDevToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_TOOLS === "true"
  )
}

export function isDevBypassAuth(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"
}

/** Client + server: unlock all subscription gates in dev. Never true in production. */
export function isDevUnlockAll(): boolean {
  return process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL === "true"
}
