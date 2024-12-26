import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import { gameIdSchema, playerNameSchema, scoreSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = protectedProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      playerName: playerNameSchema,
      score: scoreSchema,
    }),
  )
  .mutation(async ({ input: { gameId, playerName, score }, ctx }) => {
    let playerNameInsensitive = playerName;
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
    if (matchedPlayer) {
      playerNameInsensitive = matchedPlayer.playerName;
    }
    const result = await prisma.score.upsert({
      where: {
        gamePlayerIdentifier: {
          gameId,
          playerName: playerNameInsensitive,
        },
      },
      create: {
        gameId,
        playerName: playerNameInsensitive,
        score,
        moderatorName: ctx.session.name,
      },
      update: {
        score,
      },
    });
    await pushEvent('score:added', { gameId, score: result });
    return result;
  });
