import { router as trpcRouter } from "~/server/trpc";

import { procedure as addProcedure } from "./add";
import { procedure as getProcedure } from "./get";
import { procedure as listProcedure } from "./list";

export const router = trpcRouter({
  get: getProcedure,
  add: addProcedure,
  list: listProcedure,
});
