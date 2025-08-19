import type { z } from "zod";

import type { gameUpdateObject } from "~/server/schemas";
import type { GameType, ScoreType } from "~/utils/types";

export type SubscriptionMapping = {
  "score:upsert": {
    gameId: string;
    playerName: string;
    score: Pick<
      ScoreType,
      "createdAt" | "updatedAt" | "values" | "moderatorName"
    >;
  };
  "score:removed": {
    gameId: string;
    playerName: string;
  };
  "game:added": {
    game: GameType;
  };
  "game:removed": {
    id: string;
  };
  "game:updated": {
    id: string;
    updateObject: z.infer<typeof gameUpdateObject>;
  };
};
