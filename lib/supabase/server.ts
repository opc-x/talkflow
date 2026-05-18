import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@talkflow.local",
  user_metadata: {} as Record<string, unknown>,
  app_metadata: {} as Record<string, unknown>,
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export async function createClient() {
  const cookieStore = await cookies();

  const realClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    },
  );

  if (process.env.DEV_BYPASS_AUTH !== "true") return realClient;

  // Dev bypass mode: return a hybrid client where auth.getUser() returns a
  // fake user but all DB calls (.from()) still hit the real Supabase.
  return {
    auth: {
      getUser: async () => ({ data: { user: DEV_USER }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: realClient.auth.signOut.bind(realClient.auth),
    },
    from: realClient.from.bind(realClient),
    rpc: realClient.rpc.bind(realClient),
    storage: realClient.storage,
    functions: realClient.functions,
    channel: realClient.channel.bind(realClient),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}
