import { protectedProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import { gameIdSchema, playerNameSchema, scoresSchema } from '~/server/schemas';
import { pushEvent } from '~/server/pusher';
import { getScores } from '~/utils/jsons';

export const procedure = protectedProcedure
  .input(
    z.object({
      gameId: gameIdSchema,
      playerName: playerNameSchema,
      scores: scoresSchema,
    }),
  )
  .mutation(async ({ input: { gameId, playerName, scores: values }, ctx }) => {
    const matchedScore = await prisma.score.findFirst({
      where: {
        gameId,
        playerName: {
          equals: playerName,
          mode: 'insensitive',
        },
      },
      select: {
        playerName: true,
        values: true,
        game: true,
      },
    });
    const playerNameInsensitive = matchedScore
      ? matchedScore.playerName
      : playerName;
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
        values: values.map((scoreValue) => {
          if (scoreValue.type === 'counter') {
            const matchedValue = getScores(matchedScore?.values).find(
              (score) => score.key === scoreValue.key,
            );
            if (!matchedValue) {
              return scoreValue;
            }
            return {
              ...scoreValue,
              value: scoreValue.value + matchedValue.value,
            };
          }
          return scoreValue;
        }),
        moderatorName: ctx.session.name,
      },
      update: {
        values,
      },
    });

    await pushEvent('score:upsert', { gameId, playerName, score: result });
  });
