import { apiFetch } from "./client"

export async function createCheckout(plan: "basic" | "pro") {
  return apiFetch<{ message?: string; url?: string; plan?: string }>("/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  })
}
