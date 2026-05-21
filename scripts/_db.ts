import pg from "pg";
import { getDatabaseUrl } from "./_env.js";

const { Client } = pg;

export async function withClient<T>(
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
