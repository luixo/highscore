import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { gameIdSchema, playerNameSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';
import { TRPCError } from '@trpc/server';

export const procedure = protectedProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      playerName: playerNameSchema,
    }),
  )
  .mutation(async ({ input: { gameId, playerName } }) => {
    const matchedPlayer = await prisma.score.findFirst({
      where: {
        gameId,
        playerName: {
          equals: playerName,
          mode: 'insensitive',
        },
      },
      select: {
        playerName: true,
      },
    });
    if (!matchedPlayer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Player with name "${playerName}" not found`,
      });
    }
    await prisma.score.delete({
      where: {
        gamePlayerIdentifier: { gameId, playerName: matchedPlayer.playerName },
      },
    });
    await pushEvent('score:removed', {
      gameId,
      playerName: matchedPlayer.playerName,
    });
  });
