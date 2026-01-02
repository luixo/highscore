import type React from "react";

import { Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Game } from "~/entities/game";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import type { EventId } from "~/server/schemas";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

const ScoreListInner = suspendedFallback<{ eventId: EventId }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    const { t } = useTranslation();
    const { data: games } = useSuspenseQuery(
      trpc.games.list.queryOptions({ eventId }),
    );
    return (
      <>
        {games.length === 0 ? (
          <h2>{t("scoreList.noGames")}</h2>
        ) : (
          games.map((game) => <Game key={game.id} game={game} />)
        )}
      </>
    );
  },
  Array.from({ length: 3 }).map((_, index) => (
    <Skeleton
      key={index}
      className="min-h-[250px] w-[320px] rounded-lg lg:w-[240px]"
    />
  )),
);

export const ScoreList: React.FC<{ eventId: EventId }> = ({ eventId }) => (
  <div className="flex flex-wrap items-start justify-center gap-2">
    <ScoreListInner eventId={eventId} />
  </div>
);
