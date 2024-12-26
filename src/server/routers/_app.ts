import { createCallerFactory, publicProcedure, router } from '~/server/trpc';
import { router as gamesRouter } from './games/index';
import { router as scoresRouter } from './scores/index';
import { router as moderatorRouter } from './moderators/index';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'OK'),
  games: gamesRouter,
  scores: scoresRouter,
  moderator: moderatorRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
