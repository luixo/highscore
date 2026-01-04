import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import { eventAliasSchema, eventIdSchema } from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      idOrAlias: eventIdSchema.or(eventAliasSchema),
    }),
  )
  .query(async ({ input: { idOrAlias } }) => {
    const id = eventIdSchema.safeParse(idOrAlias).data;
    const db = getDatabase();
    const result = await db
      .selectFrom("events")
      .where((qb) => qb.or({ id: id, alias: idOrAlias }))
      .select(["id", "alias"])
      .executeTakeFirst();
    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Event id or alias "${idOrAlias}" not found.`,
      });
    }
    return {
      id: result.id,
      alias: result.alias ?? undefined,
    };
  });
