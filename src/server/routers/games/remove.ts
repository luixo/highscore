import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { eventIdSchema, gameIdSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";
import { adminProcedure } from "~/server/trpc";

export const procedure = adminProcedure
  .input(z.object({ eventId: eventIdSchema, id: gameIdSchema }))
  .mutation(async ({ input: { id } }) => {
    const db = getDatabase();
    await db.deleteFrom("games").where("id", "=", id).executeTakeFirst();
    await pushEvent("game:removed", { id });
  });
