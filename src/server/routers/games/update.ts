import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { adminProcedure } from "~/server/router";
import { gameIdSchema, gameUpdateObject } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";

export const procedure = adminProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      updateObject: gameUpdateObject,
    }),
  )
  .mutation(async ({ input: { gameId, updateObject } }) => {
    const db = getDatabase();
    await db
      .updateTable("games")
      .where("id", "=", gameId)
      .set({
        title: updateObject.title,
      })
      .executeTakeFirst();
    await pushEvent("game:updated", { id: gameId, updateObject });
  });
