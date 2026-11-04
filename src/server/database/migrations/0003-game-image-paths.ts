import type { Database } from "~/server/database/database";

export const up = async (db: Database) => {
	await db.schema.alterTable("games").dropColumn("logoUrl").execute();
};

export const down = async (db: Database) => {
	await db.schema.alterTable("games").addColumn("logoUrl", "varchar").execute();
};
