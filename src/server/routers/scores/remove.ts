import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { gameIdSchema, playerNameSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
import { protectedProcedure } from "~/server/trpc";

export const procedure = protectedProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      playerName: playerNameSchema,
    }),
  )
  .mutation(async ({ input: { gameId, playerName } }) => {
    const db = getDatabase();

    const matchedPlayer = await db
      .selectFrom("scores")
      .where(({ and }) => and({ gameId, playerName }))
      .select("playerName")
      .executeTakeFirst();
    if (!matchedPlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Player with name "${playerName}" not found`,
      });
    }
    await db
      .deleteFrom("scores")
      .where(({ and }) =>
        and({
          gameId,
          playerName: matchedPlayer.playerName,
        }),
      )
      .executeTakeFirst();
    await pushEvent("score:removed", {
      gameId,
      playerName: matchedPlayer.playerName,
    });
  });
