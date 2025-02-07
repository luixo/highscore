import { z } from 'zod';

import { publicProcedure } from '~/server/trpc';
import { prisma } from '~/server/prisma';
import { gameIdSchema } from '~/server/schemas';

export const procedure = publicProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
    }),
  )
  .query(async ({ input: { gameId } }) => {
    const scores = await prisma.score.findMany({
      select: {
        playerName: true,
        score: true,
        scoreCount: true,
        createdAt: true,
        updatedAt: true,
        moderatorName: true,
        gameId: true,
      },
      where: {
        gameId,
      },
      orderBy: {
        score: 'desc',
      },
    });
    return scores;
  });
