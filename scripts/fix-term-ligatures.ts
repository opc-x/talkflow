import { loadEnv } from "./_env.js";
import { withClient } from "./_db.js";

loadEnv();

const LIGATURE_RE = /[\uFB00-\uFB04\uFB01\uFB02\uFB03\uFB04ﬁﬂﬀﬃﬄ]/;

function fixLigatures(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\uFB00/g, "ff")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl");
}

async function main() {
  await withClient(async (client) => {
    const { rows } = await client.query<{ id: number; term: string; normalized: string }>(
      `select id, term, normalized from public.terms
       where term ~ '[\\uFB00-\\uFB04ﬁﬂﬀﬃﬄ]' or normalized ~ '[\\uFB00-\\uFB04ﬁﬂﬀﬃﬄ]'`,
    );

    let updated = 0;
    for (const row of rows) {
      const term = fixLigatures(row.term);
      const normalized = fixLigatures(row.normalized).toLowerCase().trim();
      if (term === row.term && normalized === row.normalized) continue;
      await client.query(
        `update public.terms set term = $1, normalized = $2 where id = $3`,
        [term, normalized, row.id],
      );
      updated++;
      console.log(`  fixed #${row.id}: ${row.term} → ${term}`);
    }

    const { rows: remaining } = await client.query<{ n: number }>(
      `select count(*)::int as n from public.terms where term ~ '[\\uFB00-\\uFB04ﬁﬂﬀﬃﬄ]'`,
    );
    console.log(`✅ Updated ${updated} terms; remaining ligatures: ${remaining[0]?.n ?? 0}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
