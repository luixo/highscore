import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import {
  gameIdSchema,
  playerNameSchema,
  scoreUpdateObject,
} from '~/server/schemas';
import { pushEvent } from '~/server/pusher';

export const procedure = adminProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      playerName: playerNameSchema,
      updateObject: scoreUpdateObject,
    }),
  )
  .mutation(async ({ input: { gameId, playerName, updateObject } }) => {
    await prisma.score.update({
      where: {
        gamePlayerIdentifier: {
          gameId,
          playerName,
        },
      },
      data:
        updateObject.type === 'playerName'
          ? {
              playerName: updateObject.playerName,
            }
          : {
              score: updateObject.score,
            },
    });
    await pushEvent('score:updated', { gameId, playerName, updateObject });
  });