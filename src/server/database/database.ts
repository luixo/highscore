import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB } from "~/server/database/database.gen";
import { env } from "~/server/env";

export const getDatabase = () => {
	const pool = new Pool({ connectionString: env.DATABASE_URL });
	return new Kysely<DB>({
		dialect: new PostgresDialect({ pool }),
	});
};

export type Database = ReturnType<typeof getDatabase>;
