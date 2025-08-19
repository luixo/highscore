import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { getScores } from "~/server/jsons";
import {
  gameIdSchema,
  playerNameSchema,
  scoreUpdateObject,
} from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
import { adminProcedure } from "~/server/trpc";

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
      .where(({ and }) =>
        and({
          gameId,
          playerName,
        }),
      )
      .set(
        updateObject.type === "playerName"
          ? {
              playerName: updateObject.playerName,
            }
          : updateObject.type === "scores"
            ? {
                values: {
                  values: updateObject.scores,
                },
              }
            : {},
      )
      .returning(["scores.updatedAt", "scores.values", "scores.createdAt"])
      .executeTakeFirstOrThrow();
    const nextScore = {
      ...score,
      values: getScores(score.values).values,
      moderatorName: ctx.session.name,
    };
    await pushEvent("score:upsert", {
      gameId,
      playerName,
      score: nextScore,
    });
    return nextScore;
  });
