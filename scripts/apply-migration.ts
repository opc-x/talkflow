import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const migrationPath = resolve(
  import.meta.dirname,
  "../supabase/migrations/202605210003_scene_schema_final.sql",
);

async function main() {
  const sql = readFileSync(migrationPath, "utf8");
  await withClient(async (client) => {
    await client.query(sql);
  });
  console.log("✅ Migration applied:", migrationPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
