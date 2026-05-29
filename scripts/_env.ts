import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Keys from .env.local always win over inherited shell env (e.g. wrong OPENAI_API_KEY). */
const LOCAL_OVERRIDE = /^(OPENAI_|DATABASE_|SUPABASE_|GITHUB_|GH_)/;

function loadEnvFile(path: string, localOverride = false) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (localOverride && LOCAL_OVERRIDE.test(key)) {
      process.env[key] = value;
    } else if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadEnv() {
  const root = resolve(import.meta.dirname, "..");
  loadEnvFile(resolve(root, ".env.local"), true);
  loadEnvFile(resolve(root, ".env"));
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF ?? "frhtkmpsfyyidqijuijp";
  if (!password) {
    throw new Error(
      "Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local",
    );
  }

  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres`;
}

export function getGitHubToken(): string {
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
}
