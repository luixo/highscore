import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { publicProcedure } from "~/server/router";
import { eventIdSchema } from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      id: eventIdSchema,
    }),
  )
  .query(async ({ input: { id } }) => {
    const db = getDatabase();
    const result = await db
      .selectFrom("events")
      .where("id", "=", id)
      .select(["id", "title", "alias"])
      .executeTakeFirst();
    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Event id "${id}" not found.`,
      });
    }
    return result;
  });
