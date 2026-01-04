import { z } from "zod";

import { getDatabase } from "~/server/database/database";
import {
  getAggregation,
  getFormatting,
  getInputs,
  getSort,
} from "~/server/jsons";
import { publicProcedure } from "~/server/router";
import { eventIdSchema } from "~/server/schemas";

export const procedure = publicProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
    }),
  )
  .query(async ({ input: { eventId } }) => {
    const db = getDatabase();
    const games = await db
      .selectFrom("games")
      .where("eventId", "=", eventId)
      .orderBy("createdAt", "asc")
      .select([
        "id",
        "title",
        "logoUrl",
        "inputs",
        "formatting",
        "aggregation",
        "sort",
        "createdAt",
        "updatedAt",
        "eventId",
      ])
      .execute();
    return games.map((game) => ({
      ...game,
      sort: getSort(game.sort),
      inputs: getInputs(game.inputs),
      formatting: getFormatting(game.formatting),
      aggregation: getAggregation(game.aggregation),
    }));
  });
