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
  .output(
    z.discriminatedUnion('type', [
      z.strictObject({
        type: z.literal('old'),
        result: z.object({
          score: scoreSchema,
        }),
      }),
      z.strictObject({
        type: z.literal('new'),
        result: z.object({
          score: scoreSchema,
        }),
      }),
    ]),
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
        score: true,
        game: true,
      },
    });
    if (matchedPlayer) {
      playerNameInsensitive = matchedPlayer.playerName;
      if (matchedPlayer.score) {
        if (matchedPlayer.game.sortDirection === 'Asc') {
          if (matchedPlayer.score <= score) {
            return {
              type: 'old',
              result: { score: matchedPlayer.score },
            };
          }
        } else {
          if (matchedPlayer.score >= score) {
            return {
              type: 'old',
              result: { score: matchedPlayer.score },
            };
          }
        }
      }
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
    return { type: 'new', result: { score: result.score } };
  });
