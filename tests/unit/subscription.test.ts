import { describe, it, expect } from "vitest"
import { normalizePlan, isStageLocked } from "@/lib/subscription"

describe("normalizePlan", () => {
  it("passes through real plans", () => {
    expect(normalizePlan("basic")).toBe("basic")
    expect(normalizePlan("pro")).toBe("pro")
  })
  it("maps aliases daily→basic, full→pro", () => {
    expect(normalizePlan("daily")).toBe("basic")
    expect(normalizePlan("full")).toBe("pro")
  })
  it("defaults unknown/null to free", () => {
    expect(normalizePlan(null)).toBe("free")
    expect(normalizePlan("garbage")).toBe("free")
  })
})

describe("isStageLocked", () => {
  it("locks a higher-tier stage for a lower-tier user", () => {
    expect(isStageLocked("pro", "free")).toBe(true)
    expect(isStageLocked("basic", "free")).toBe(true)
  })
  it("unlocks when user tier >= stage tier", () => {
    expect(isStageLocked("free", "free")).toBe(false)
    expect(isStageLocked("basic", "pro")).toBe(false)
  })
})
