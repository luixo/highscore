import { sql } from "kysely";

import type { Database } from "~/server/database/database";

const UPDATE_COLUMN_RAW = sql.raw("updateTimestampColumn");

const createUpdateFunction = async (db: Database) => {
  await sql`
	CREATE OR REPLACE FUNCTION ${UPDATE_COLUMN_RAW} ()
		RETURNS TRIGGER
		AS $$
			BEGIN
				NEW.${sql.id("updatedAt")} = ${sql.raw("now()")};
				RETURN NEW;
			END;
		$$
	LANGUAGE 'plpgsql';
	`.execute(db);
};

const removeUpdateFunction = async (db: Database) => {
  await sql`DROP FUNCTION ${UPDATE_COLUMN_RAW}();`.execute(db);
};

const createEnums = async (db: Database) => {
  await db.schema
    .createType("moderatorRole")
    .asEnum(["admin", "moderator"])
    .execute();
};

const dropEnums = async (db: Database) => {
  await db.schema.dropType("moderatorRole").execute();
};

const createEventsTable = async (db: Database) => {
  await db.schema
    .createTable("events")
    .ifNotExists()
    .addColumn("id", "uuid", (cb) =>
      cb.defaultTo(sql`gen_random_uuid()`).primaryKey(),
    )
    .addColumn("title", "varchar", (cb) => cb.notNull())
    .addColumn("createdAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updatedAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();
};

const dropEventsTable = async (db: Database) => {
  await db.schema.dropTable("events").ifExists().execute();
};

const createGamesTable = async (db: Database) => {
  await db.schema
    .createTable("games")
    .ifNotExists()
    .addColumn("id", "uuid", (cb) =>
      cb
        .defaultTo(sql`gen_random_uuid()`)
        .primaryKey()
        .notNull(),
    )
    .addColumn("title", "varchar", (cb) => cb.notNull())
    .addColumn("logoUrl", "varchar")
    .addColumn("eventId", "uuid", (cb) =>
      cb
        .notNull()
        .references("events.id")
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("sort", "jsonb", (cb) => cb.notNull())
    .addColumn("formatting", "jsonb", (cb) => cb.notNull())
    .addColumn("aggregation", "jsonb", (cb) => cb.notNull())
    .addColumn("inputs", "jsonb", (cb) => cb.notNull())
    .addColumn("createdAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updatedAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .execute();
  await db.schema
    .createIndex("games_eventId_index")
    .on("games")
    .column("eventId")
    .execute();
};

const dropGamesTable = async (db: Database) => {
  await db.schema.dropIndex("games_eventId_index").execute();
  await db.schema.dropTable("games").ifExists().execute();
};

const createModeratorsTable = async (db: Database) => {
  await db.schema
    .createTable("moderators")
    .ifNotExists()
    .addColumn("id", "bigserial", (cb) => cb.primaryKey())
    .addColumn("name", "varchar", (cb) => cb.notNull())
    .addColumn("key", "varchar", (cb) => cb.notNull())
    .addColumn("role", sql`"moderatorRole"`, (cb) => cb.notNull())
    .addColumn("eventId", "uuid", (cb) =>
      cb
        .notNull()
        .references("events.id")
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("createdAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updatedAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addUniqueConstraint("moderators_key_event_constraint", ["key", "eventId"])
    .execute();
  await db.schema
    .createIndex("moderators_eventId_index")
    .on("games")
    .column("eventId")
    .execute();
};

const dropModeratorsTable = async (db: Database) => {
  await db.schema.dropIndex("moderators_eventId_index").execute();
  await db.schema.dropTable("moderators").ifExists().execute();
};

const createScoresTable = async (db: Database) => {
  await db.schema
    .createTable("scores")
    .ifNotExists()
    .addColumn("playerName", "varchar", (cb) => cb.notNull())
    .addColumn("gameId", "uuid", (cb) =>
      cb
        .notNull()
        .references("games.id")
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("moderatorId", "bigserial", (cb) =>
      cb
        .notNull()
        .references("moderators.id")
        .onUpdate("cascade")
        .onDelete("cascade"),
    )
    .addColumn("values", "jsonb", (cb) => cb.notNull())
    .addColumn("createdAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addColumn("updatedAt", "timestamptz", (cb) =>
      cb.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addPrimaryKeyConstraint("games_player_game_constraint", [
      "playerName",
      "gameId",
    ])
    .execute();
  await db.schema
    .createIndex("scores_gameId_index")
    .on("scores")
    .column("gameId")
    .execute();
};

const dropScoresTable = async (db: Database) => {
  await db.schema.dropIndex("scores_gameId_index").execute();
  await db.schema.dropTable("scores").ifExists().execute();
};

export const up = async (db: Database) => {
  await createUpdateFunction(db);

  await createEnums(db);
  await createEventsTable(db);
  await createGamesTable(db);
  await createModeratorsTable(db);
  await createScoresTable(db);
};

export const down = async (db: Database) => {
  await dropScoresTable(db);
  await dropModeratorsTable(db);
  await dropGamesTable(db);
  await dropEventsTable(db);
  await dropEnums(db);

  await removeUpdateFunction(db);
};
