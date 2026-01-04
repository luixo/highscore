import { z } from "zod";

import { protectedProcedure } from "~/server/router";
import { eventIdSchema } from "~/server/schemas";

export const procedure = protectedProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .query(({ ctx }) => ctx.session);
