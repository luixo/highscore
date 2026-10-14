import { z } from "zod";
import { getDatabase } from "~/server/database/database";
import { getScores } from "~/server/jsons";
import { adminProcedure } from "~/server/router";
import {
	gameIdSchema,
	playerNameSchema,
	scoreUpdateObject,
} from "~/server/schemas";
import { pushEvent } from "~/server/subscription";

const getUpdateObject = (updateObject: z.infer<typeof scoreUpdateObject>) => {
	switch (updateObject.type) {
		case "playerName": {
			return {
				playerName: updateObject.playerName,
			};
		}
		case "scores": {
			return {
				values: {
					values: updateObject.scores,
				},
			};
		}
	}
};

export const procedure = adminProcedure
	.input(
		z.object({
			gameId: gameIdSchema,
			playerName: playerNameSchema,
			updateObject: scoreUpdateObject,
		}),
	)
	.mutation(async ({ ctx, input: { gameId, playerName, updateObject } }) => {
		const db = getDatabase();
		const score = await db
			.updateTable("scores")
			.where((eb) =>
				eb.and({
					gameId,
					playerName,
				}),
			)
			.set(getUpdateObject(updateObject))
			.returning(["scores.updatedAt", "scores.values", "scores.createdAt"])
			.executeTakeFirstOrThrow();
		const nextScore = {
			...score,
			moderatorName: ctx.session.name,
			values: getScores(score.values).values,
		};
		await pushEvent("score:upsert", {
			gameId,
			playerName,
			score: nextScore,
		});
		return nextScore;
	});
