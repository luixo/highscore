import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import { eventIdSchema } from "~/server/schemas";
import { protectedProcedure } from "~/server/trpc";

export const procedure = protectedProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .query(async ({ ctx, input: { eventId } }) => {
    if (ctx.session.role !== "admin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Only admin can see moderator list",
      });
    }
    const db = getDatabase();
    const moderators = await db
      .selectFrom("moderators")
      .where("eventId", "=", eventId)
      .select(["key", "name", "role"])
      .execute();
    return moderators;
  });
