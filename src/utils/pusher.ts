import { inferProcedureOutput } from '@trpc/server';
import type { z } from 'zod';
import type { AppRouter } from '~/server/routers/_app';
import { gameUpdateObject } from '~/server/schemas';

export const getChannelName = () => 'highscore';

export type PusherMapping = {
  'score:added': {
    gameId: string;
    score: inferProcedureOutput<AppRouter['scores']['list']>[number];
  };
  'score:removed': {
    gameId: string;
    playerName: string;
  };
  'game:added': {
    game: inferProcedureOutput<AppRouter['games']['list']>[number];
  };
  'game:removed': {
    id: string;
  };
  'game:updated': {
    id: string;
    updateObject: z.infer<typeof gameUpdateObject>;
  };
};
