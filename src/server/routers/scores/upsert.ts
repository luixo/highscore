import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import type { Json } from "~/server/database/database.gen";
import { getAggregation, getScores, getSort } from "~/server/jsons";
import { protectedProcedure } from "~/server/router";
import { gameIdSchema, playerNameSchema, scoresSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
import { aggregateScore } from "~/utils/aggregation";
import type { ScoreType } from "~/utils/types";

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
      .where(({ and }) => and({ gameId, playerName }))
      .select([
        "playerName",
        "values",
        "games.aggregation",
        "games.inputs",
        "games.sort",
      ])
      .executeTakeFirst();
    const playerNameInsensitive = matchedScore
      ? matchedScore.playerName
      : playerName;
    let result: Omit<ScoreType, "playerName" | "moderatorName" | "values"> & {
      values: Json;
      moderatorId: string;
    };
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
        return;
      }
      result = await db
        .updateTable("scores")
        .where(({ and }) =>
          and({
            gameId,
            playerName: playerNameInsensitive,
          }),
        )
        .set({ values: scores })
        .returning(["createdAt", "updatedAt", "values", "moderatorId"])
        .executeTakeFirstOrThrow();
    } else {
      result = await db
        .insertInto("scores")
        .values({
          gameId,
          playerName: playerNameInsensitive,
          values: scores,
          moderatorId: ctx.session.id,
        })
        .returning(["createdAt", "updatedAt", "values", "moderatorId"])
        .executeTakeFirstOrThrow();
    }
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
        updatedAt: result.updatedAt,
        values: getScores(result.values).values,
        moderatorName: moderator.name,
      },
    });
  });
