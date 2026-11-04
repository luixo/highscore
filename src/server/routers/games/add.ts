import { v4 } from "uuid";
import { getDatabase } from "~/server/database/database";
import {
	getAggregation,
	getFormatting,
	getInputs,
	getSort,
} from "~/server/jsons";
import { adminProcedure } from "~/server/router";
import { getImageUrl } from "~/server/s3";
import { addGameSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";

export const procedure = adminProcedure
	.input(addGameSchema)
	.mutation(
		async ({
			input: {
				eventId,
				title,
				id = v4(),
				inputs,
				aggregation,
				formatting,
				sort,
			},
		}) => {
			const db = getDatabase();
			const gameRaw = await db
				.insertInto("games")
				.values({
					aggregation,
					eventId,
					formatting,
					id,
					inputs,
					sort,
					title,
				})
				.returning([
					"eventId",
					"id",
					"title",
					"inputs",
					"aggregation",
					"formatting",
					"sort",
					"createdAt",
					"updatedAt",
				])
				.executeTakeFirstOrThrow();
			const game = {
				...gameRaw,
				aggregation: getAggregation(gameRaw.aggregation),
				formatting: getFormatting(gameRaw.formatting),
				inputs: getInputs(gameRaw.inputs),
				logoUrl: getImageUrl(gameRaw.id),
				sort: getSort(gameRaw.sort),
			};
			await pushEvent("game:added", { game });
			return game;
		},
	);
