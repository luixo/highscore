import { router as trpcRouter } from "~/server/trpc";

import { procedure as addProcedure } from "./add";
import { procedure as aliasAvailableProcedure } from "./alias-available";
import { procedure as getProcedure } from "./get";
import { procedure as getByAliasProcedure } from "./getByAlias";
import { procedure as removeProcedure } from "./remove";

export const router = trpcRouter({
  get: getProcedure,
  getByAlias: getByAliasProcedure,
  add: addProcedure,
  remove: removeProcedure,
  aliasAvailable: aliasAvailableProcedure,
});
