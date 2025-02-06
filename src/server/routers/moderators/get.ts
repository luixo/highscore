import { z } from 'zod';
import { eventIdSchema } from '~/server/schemas';
import { protectedProcedure } from '~/server/trpc';

export const procedure = protectedProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .query(({ ctx }) => ctx.session);
