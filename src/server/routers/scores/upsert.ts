import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import type { Json } from "~/server/database/database.gen";
import { getScores } from "~/server/jsons";
import { protectedProcedure } from "~/server/router";
import { gameIdSchema, playerNameSchema, scoresSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
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
      .where(({ and }) => and({ gameId, playerName }))
      .select(["playerName", "values"])
      .executeTakeFirst();
    const playerNameInsensitive = matchedScore
      ? matchedScore.playerName
      : playerName;
    let result: Omit<ScoreType, "playerName" | "moderatorName" | "values"> & {
      values: Json;
      moderatorId: string;
    };
    if (matchedScore) {
      result = await db
        .updateTable("scores")
        .where(({ and }) =>
          and({
            gameId,
            playerName: playerNameInsensitive,
          }),
        )
        .set({
          values: {
            ...scores,
            values: scores.values.map((scoreValue) => {
              const matchedValue = getScores(matchedScore?.values)?.values.find(
                (score) => score.key === scoreValue.key,
              );
              if (scoreValue.type === "counter") {
                if (!matchedValue) {
                  return scoreValue;
                }
                return {
                  ...scoreValue,
                  value: matchedValue.value + scoreValue.value,
                };
              }
              return scoreValue;
            }),
          },
        })
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
