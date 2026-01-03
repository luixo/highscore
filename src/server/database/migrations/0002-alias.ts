import type { Database } from "~/server/database/database";

const addEventAlias = async (db: Database) => {
  await db.schema
    .alterTable("events")
    .addColumn("alias", "varchar", (col) => col.unique())
    .execute();
};

const removeEventAlias = async (db: Database) => {
  await db.schema.alterTable("events").dropColumn("alias").execute();
};

export const up = async (db: Database) => {
  await addEventAlias(db);
};

export const down = async (db: Database) => {
  await removeEventAlias(db);
};
