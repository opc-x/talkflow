import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Stripe Checkout stub — wire STRIPE_SECRET_KEY when #12 is fully deployed */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const plan = body.plan === "pro" ? "pro" : "basic"

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      message: `已选择 ${plan === "pro" ? "Pro" : "Basic"} 计划。Stripe 尚未配置，请联系管理员或稍后再试。`,
    })
  }

  // Placeholder for Stripe session creation
  return NextResponse.json({
    message: "Stripe 集成进行中，请稍后再试。",
    plan,
  })
}
