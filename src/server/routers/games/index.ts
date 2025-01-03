import { router as trpcRouter } from '~/server/trpc';

import { procedure as listProcedure } from './list';
import { procedure as addProcedure } from './add';
import { procedure as updateProcedure } from './update';
import { procedure as removeProcedure } from './remove';

export const router = trpcRouter({
  list: listProcedure,
  add: addProcedure,
  remove: removeProcedure,
  update: updateProcedure,
});
