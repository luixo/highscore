import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { adminProcedure } from "~/server/router";
import { eventIdSchema } from "~/server/schemas";

export const procedure = adminProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .mutation(async ({ input: { eventId } }) => {
    const db = getDatabase();
    await db.deleteFrom("events").where("id", "=", eventId).executeTakeFirst();
  });
