import { router as trpcRouter } from '~/server/trpc';

import { procedure as addProcedure } from './add';
import { procedure as getProcedure } from './get';

export const router = trpcRouter({
  get: getProcedure,
  add: addProcedure,
});
