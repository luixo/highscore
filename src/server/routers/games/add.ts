import { v4 } from "uuid";

import { getDatabase } from "~/server/database/database";
import {
  getAggregation,
  getFormatting,
  getInputs,
  getSort,
} from "~/server/jsons";
import { adminProcedure } from "~/server/router";
import { addGameSchema } from "~/server/schemas";
import { pushEvent } from "~/server/subscription";

export const procedure = adminProcedure
  .input(addGameSchema)
  .mutation(
    async ({
      input: { eventId, title, logoUrl, inputs, aggregation, formatting, sort },
    }) => {
      const db = getDatabase();
      const id = v4();
      const gameRaw = await db
        .insertInto("games")
        .values({
          id,
          eventId,
          title,
          logoUrl,
          inputs,
          aggregation,
          formatting,
          sort,
        })
        .returning([
          "eventId",
          "id",
          "title",
          "logoUrl",
          "inputs",
          "aggregation",
          "formatting",
          "sort",
          "createdAt",
          "updatedAt",
        ])
        .executeTakeFirstOrThrow();
      const game = {
        ...gameRaw,
        sort: getSort(gameRaw.sort),
        inputs: getInputs(gameRaw.inputs),
        formatting: getFormatting(gameRaw.formatting),
        aggregation: getAggregation(gameRaw.aggregation),
      };
      await pushEvent("game:added", { game });
      return game;
    },
  );
