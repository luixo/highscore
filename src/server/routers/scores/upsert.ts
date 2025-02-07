import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import { gameIdSchema, playerNameSchema, scoreSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';
import { getAggregation } from '~/utils/aggregation';

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
        scoreCount: true,
        game: true,
      },
    });
    const playerNameInsensitive = matchedPlayer
      ? matchedPlayer.playerName
      : playerName;
    const aggregation = getAggregation(matchedPlayer?.game.aggregation);
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
        scoreCount: 1,
      },
      update: {
        score:
          aggregation && aggregation.type === 'arithmetic'
            ? (matchedPlayer?.score ?? 0) + score
            : score,
        scoreCount: (matchedPlayer?.scoreCount ?? 0) + 1,
      },
    });

    await pushEvent('score:upsert', { gameId, playerName, score: result });
    if (matchedPlayer) {
      if (!aggregation || aggregation.type !== 'arithmetic') {
        switch (matchedPlayer.game.sortDirection) {
          case 'Asc':
            if (matchedPlayer.score <= score) {
              return {
                type: 'old',
                result: { score: matchedPlayer.score },
              };
            }
            break;
          case 'Desc':
            if (matchedPlayer.score >= score) {
              return {
                type: 'old',
                result: { score: matchedPlayer.score },
              };
            }
            break;
        }
      }
    }
    return { type: 'new' as const, result: { score: result.score } };
  });
