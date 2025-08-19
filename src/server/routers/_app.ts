import { createCallerFactory, publicProcedure, router } from "~/server/trpc";

import { router as eventsRouter } from "./events/index";
import { router as gamesRouter } from "./games/index";
import { router as moderatorRouter } from "./moderators/index";
import { router as scoresRouter } from "./scores/index";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "OK"),
  games: gamesRouter,
  scores: scoresRouter,
  moderator: moderatorRouter,
  events: eventsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
