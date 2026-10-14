import { router as trpcRouter } from "~/server/router";
import { procedure as addProcedure } from "./add";
import { procedure as listProcedure } from "./list";
import { procedure as removeProcedure } from "./remove";
import { procedure as updateProcedure } from "./update";

export const router = trpcRouter({
	add: addProcedure,
	list: listProcedure,
	remove: removeProcedure,
	update: updateProcedure,
});
