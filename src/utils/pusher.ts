import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import type { gameUpdateObject } from '~/server/schemas';

export const getChannelName = () => 'highscore';

export type PusherMapping = {
  'score:upsert': {
    gameId: string;
    playerName: string;
    score: Prisma.ScoreGetPayload<{}>;
  };
  'score:removed': {
    gameId: string;
    playerName: string;
  };
  'game:added': {
    game: Prisma.GameGetPayload<{}>;
  };
  'game:removed': {
    id: string;
  };
  'game:updated': {
    id: string;
    updateObject: z.infer<typeof gameUpdateObject>;
  };
};
