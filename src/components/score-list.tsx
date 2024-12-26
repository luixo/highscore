import type { FC } from 'react';
import { Game } from '~/components/game';
import { trpc } from '~/utils/trpc';

export const ScoreList: FC = () => {
  const gamesQuery = trpc.games.list.useQuery();
  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      {gamesQuery.data?.map((game) => <Game key={game.id} game={game} />)}
      {gamesQuery.data?.length === 0 ? <h2>Игр пока что нет</h2> : null}
    </div>
  );
};
