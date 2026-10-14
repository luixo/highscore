import { router as trpcRouter } from "~/server/router";
import { procedure as addProcedure } from "./add";
import { procedure as aliasAvailableProcedure } from "./alias-available";
import { procedure as getProcedure } from "./get";
import { procedure as getByAliasProcedure } from "./get-by-alias";
import { procedure as removeProcedure } from "./remove";
import { procedure as updateProcedure } from "./update";

export const router = trpcRouter({
	add: addProcedure,
	aliasAvailable: aliasAvailableProcedure,
	get: getProcedure,
	getByAlias: getByAliasProcedure,
	remove: removeProcedure,
	update: updateProcedure,
});
