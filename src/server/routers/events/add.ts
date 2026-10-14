import { v4 } from "uuid";
import { z } from "zod";
import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import {
	eventAliasSchema,
	eventNameSchema,
	moderatorKeySchema,
	moderatorNameSchema,
} from "~/server/schemas";

export const procedure = publicProcedure
	.input(
		z.object({
			adminKey: moderatorKeySchema,
			adminName: moderatorNameSchema,
			alias: eventAliasSchema.optional(),
			title: eventNameSchema,
		}),
	)
	.mutation(async ({ input: { title, alias, adminKey, adminName } }) => {
		const db = getDatabase();
		const id = v4();
		const result = await db
			.insertInto("events")
			.values({ alias, id, title })
			.returning(["id", "title", "alias"])
			.executeTakeFirstOrThrow();
		await db
			.insertInto("moderators")
			.values({
				eventId: result.id,
				key: adminKey,
				name: adminName,
				role: "admin",
			})
			.executeTakeFirst();
		return result;
	});
