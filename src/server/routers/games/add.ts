import { v4 } from "uuid";
import { getDatabase } from "~/server/database/database";
import {
	getAggregation,
	getFormatting,
	getInputs,
	getSort,
} from "~/server/jsons";
import { adminProcedure } from "~/server/router";
import { addGameSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";

export const procedure = adminProcedure
	.input(addGameSchema)
	.mutation(
		async ({
			input: { eventId, title, logoUrl, inputs, aggregation, formatting, sort },
		}) => {
			const db = getDatabase();
			const id = v4();
			const gameRaw = await db
				.insertInto("games")
				.values({
					aggregation,
					eventId,
					formatting,
					id,
					inputs,
					logoUrl,
					sort,
					title,
				})
				.returning([
					"eventId",
					"id",
					"title",
					"logoUrl",
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
				sort: getSort(gameRaw.sort),
			};
			await pushEvent("game:added", { game });
			return game;
		},
	);
