import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import type { DB } from "~/server/database/database.gen";

const getConnectionString = () => {
  const connString = process.env.DATABASE_URL;
  if (!connString) {
    throw new Error(`Expected to have DATABASE_URL in environment`);
  }
  return connString;
};

export const getDatabase = () => {
  const pool = new Pool({ connectionString: getConnectionString() });
  return new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });
};

export type Database = ReturnType<typeof getDatabase>;
