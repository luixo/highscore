import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import { eventAliasSchema } from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      alias: eventAliasSchema,
    }),
  )
  .mutation(async ({ input: { alias } }) => {
    const db = getDatabase();
    const result = await db
      .selectFrom("events")
      .where("alias", "=", alias)
      .select(["id"])
      .executeTakeFirst();
    return !result;
  });
