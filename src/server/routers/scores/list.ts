import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { getScores } from "~/server/jsons";
import { publicProcedure } from "~/server/router";
import { gameIdSchema } from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
    }),
  )
  .query(async ({ input: { gameId } }) => {
    const db = getDatabase();
    const scores = await db
      .selectFrom("scores")
      .where("gameId", "=", gameId)
      .innerJoin("moderators", (qb) =>
        qb.onRef("moderators.id", "=", "scores.moderatorId"),
      )
      .select([
        "scores.playerName",
        "scores.values",
        "scores.createdAt",
        "scores.updatedAt",
        "moderators.name as moderatorName",
      ])
      .execute();
    return scores.map((score) => ({
      ...score,
      values: getScores(score.values).values,
    }));
  });
