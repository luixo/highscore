import { z } from "zod";
import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import {
	eventAliasSchema,
	eventIdSchema,
	eventNameSchema,
} from "~/server/schemas";

export const procedure = publicProcedure
	.input(
		z.object({
			alias: eventAliasSchema.optional(),
			id: eventIdSchema,
			title: eventNameSchema,
		}),
	)
	.mutation(async ({ input: { id, title, alias } }) => {
		const db = getDatabase();
		const result = await db
			.updateTable("events")
			.where("id", "=", id)
			.set({ alias, title })
			.returning(["title", "alias"])
			.executeTakeFirstOrThrow();
		return result;
	});
