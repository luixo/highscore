import { router as trpcRouter } from '~/server/trpc';

import { procedure as listProcedure } from './list';
import { procedure as upsertProcedure } from './upsert';
import { procedure as removeProcedure } from './remove';

export const router = trpcRouter({
  list: listProcedure,
  upsert: upsertProcedure,
  remove: removeProcedure,
});
