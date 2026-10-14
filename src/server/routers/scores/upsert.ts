import { z } from "zod";
import { getDatabase } from "~/server/database/database";
import type { Games, Scores } from "~/server/database/database.gen";
import { getAggregation, getScores, getSort } from "~/server/jsons";
import { protectedProcedure } from "~/server/router";
import { gameIdSchema, playerNameSchema, scoresSchema } from "~/server/schemas";
import type { GameId } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
import { aggregateScore } from "~/utils/aggregation";

const getResult = ({
	matchedScore,
	scores,
	gameId,
	sessionId,
	playerName,
}: {
	matchedScore:
		| (Pick<Scores, "playerName" | "values"> &
				Pick<Games, "aggregation" | "inputs" | "sort">)
		| undefined;
	scores: z.infer<typeof scoresSchema>;
	gameId: GameId;
	sessionId: string;
	playerName: string;
}) => {
	const db = getDatabase();
	if (matchedScore) {
		const prevScore = aggregateScore(
			getScores(matchedScore.values).values,
			getAggregation(matchedScore.aggregation),
		);
		const nextScore = aggregateScore(
			scores.values,
			getAggregation(matchedScore.aggregation),
		);
		const sorting = getSort(matchedScore.sort);
		if (
			(sorting.direction === "asc" && nextScore > prevScore) ||
			(sorting.direction === "desc" && nextScore < prevScore)
		) {
			return db
				.selectFrom("scores")
				.where((eb) =>
					eb.and({
						gameId,
						playerName: matchedScore.playerName,
					}),
				)
				.select(["createdAt", "updatedAt", "values", "moderatorId"])
				.executeTakeFirstOrThrow();
		}
		return db
			.updateTable("scores")
			.where((eb) =>
				eb.and({
					gameId,
					playerName: matchedScore.playerName,
				}),
			)
			.set({ values: scores })
			.returning(["createdAt", "updatedAt", "values", "moderatorId"])
			.executeTakeFirstOrThrow();
	}

	return db
		.insertInto("scores")
		.values({
			gameId,
			moderatorId: sessionId,
			playerName,
			values: scores,
		})
		.returning(["createdAt", "updatedAt", "values", "moderatorId"])
		.executeTakeFirstOrThrow();
};

export const procedure = protectedProcedure
	.input(
		z.object({
			gameId: gameIdSchema,
			playerName: playerNameSchema,
			scores: scoresSchema,
		}),
	)
	.mutation(async ({ input: { gameId, playerName, scores }, ctx }) => {
		const db = getDatabase();
		const matchedScore = await db
			.selectFrom("scores")
			.innerJoin("games", (qb) => qb.onRef("games.id", "=", "scores.gameId"))
			.where((eb) => eb.and({ gameId, playerName }))
			.select([
				"scores.playerName",
				"scores.values",
				"games.aggregation",
				"games.inputs",
				"games.sort",
			])
			.executeTakeFirst();
		const result = await getResult({
			gameId,
			matchedScore,
			playerName,
			scores,
			sessionId: ctx.session.id,
		});
		const moderator = await db
			.selectFrom("moderators")
			.where("moderators.id", "=", result.moderatorId)
			.select("name")
			.executeTakeFirstOrThrow();

		await pushEvent("score:upsert", {
			gameId,
			playerName,
			score: {
				createdAt: result.createdAt,
				moderatorName: moderator.name,
				updatedAt: result.updatedAt,
				values: getScores(result.values).values,
			},
		});
	});
