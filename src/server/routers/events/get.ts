import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { eventIdSchema } from '~/server/schemas';
import { publicProcedure } from '~/server/trpc';

export const procedure = publicProcedure
  .input(
    z.object({
      id: eventIdSchema,
    }),
  )
  .query(async ({ input: { id } }) => {
    const result = await prisma.event.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
      },
    });
    if (!result) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Event id "${id}" not found.`,
      });
    }
    return result;
  });
