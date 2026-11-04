import { z } from "zod";
import { getDatabase } from "~/server/database/database";
import {
	getAggregation,
	getFormatting,
	getInputs,
	getSort,
} from "~/server/jsons";
import { publicProcedure } from "~/server/router";
import { getImageUrl } from "~/server/s3";
import { eventIdSchema } from "~/server/schemas";

export const procedure = publicProcedure
	.input(
		z.object({
			eventId: eventIdSchema,
		}),
	)
	.query(async ({ input: { eventId } }) => {
		const db = getDatabase();
		const games = await db
			.selectFrom("games")
			.where("eventId", "=", eventId)
			.orderBy("createdAt", "asc")
			.select([
				"id",
				"title",
				"inputs",
				"formatting",
				"aggregation",
				"sort",
				"createdAt",
				"updatedAt",
				"eventId",
			])
			.execute();
		return games.map((game) => ({
			...game,
			aggregation: getAggregation(game.aggregation),
			formatting: getFormatting(game.formatting),
			inputs: getInputs(game.inputs),
			logoUrl: getImageUrl(game.id),
			sort: getSort(game.sort),
		}));
	});
