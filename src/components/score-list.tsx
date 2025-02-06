import type { FC } from 'react';
import { Game } from '~/components/game';
import type { EventId } from '~/server/schemas';
import { trpc } from '~/utils/trpc';

export const ScoreList: FC<{ eventId: EventId }> = ({ eventId }) => {
  const gamesQuery = trpc.games.list.useQuery({ eventId });
  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      {gamesQuery.data?.map((game) => <Game key={game.id} game={game} />)}
      {gamesQuery.data?.length === 0 ? <h2>Игр пока что нет</h2> : null}
    </div>
  );
};
