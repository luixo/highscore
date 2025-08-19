import { v4 } from "uuid";
import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import {
  eventNameSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from "~/server/schemas";
import { publicProcedure } from "~/server/trpc";

export const procedure = publicProcedure
  .input(
    z.object({
      title: eventNameSchema,
      adminName: moderatorNameSchema,
      adminKey: moderatorKeySchema,
    }),
  )
  .mutation(async ({ input: { title, adminKey, adminName } }) => {
    const db = getDatabase();
    const id = v4();
    const result = await db
      .insertInto("events")
      .values({ id, title })
      .returning(["id", "title"])
      .executeTakeFirstOrThrow();
    await db
      .insertInto("moderators")
      .values({
        eventId: result.id,
        name: adminName,
        key: adminKey,
        role: "admin",
      })
      .executeTakeFirst();
    return result;
  });
