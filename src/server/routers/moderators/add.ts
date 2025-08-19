import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import {
  eventIdSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from "~/server/schemas";
import { adminProcedure } from "~/server/trpc";

export const procedure = adminProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
      key: moderatorKeySchema,
      name: moderatorNameSchema,
    }),
  )
  .mutation(async ({ input: { eventId, key, name } }) => {
    const db = getDatabase();
    const result = await db
      .insertInto("moderators")
      .values({
        eventId,
        key: key.toLowerCase(),
        name,
        role: "moderator",
      })
      .returning(["name", "key"])
      .executeTakeFirstOrThrow();
    return result;
  });
