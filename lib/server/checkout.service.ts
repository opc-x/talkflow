export async function createCheckoutSession(plan: "basic" | "pro") {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      message: `已选择 ${plan === "pro" ? "Pro" : "Basic"} 计划。Stripe 尚未配置，请联系管理员或稍后再试。`,
    }
  }

  return {
    message: "Stripe 集成进行中，请稍后再试。",
    plan,
  }
}
