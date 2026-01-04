import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import {
  eventAliasSchema,
  eventIdSchema,
  eventNameSchema,
} from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      id: eventIdSchema,
      title: eventNameSchema,
      alias: eventAliasSchema.optional(),
    }),
  )
  .mutation(async ({ input: { id, title, alias } }) => {
    const db = getDatabase();
    const result = await db
      .updateTable("events")
      .where("id", "=", id)
      .set({ title, alias })
      .returning(["title", "alias"])
      .executeTakeFirstOrThrow();
    return result;
  });
