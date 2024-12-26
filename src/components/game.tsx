import { FC } from 'react';
import { inferProcedureOutput } from '@trpc/server';

import type { AppRouter } from '~/server/routers/_app';
import { Scores } from '~/components/scores';
import { Card, CardBody, CardHeader, Divider } from '@nextui-org/react';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import { trpc } from '~/utils/trpc';
import { RemoveButton } from '~/components/remove-button';

export const Game: FC<{
  game: inferProcedureOutput<AppRouter['games']['list']>[number];
}> = ({ game }) => {
  const moderatorStatus = useModeratorStatus();
  const removeGameMutation = trpc.games.remove.useMutation();
  return (
    <Card className="min-h-[250px] w-[300px] max-w-[300px]">
      <CardHeader className="relative flex h-[60px] justify-end gap-2 overflow-hidden">
        <img className="absolute inset-0 -z-20 w-full" src={game.logoUrl} />
        {moderatorStatus === 'Admin' ? (
          <RemoveButton
            onClick={() => removeGameMutation.mutate({ id: game.id })}
          />
        ) : null}
      </CardHeader>
      <Divider />
      <CardBody className="max-h-[220px]">
        <Scores gameId={game.id} />
      </CardBody>
    </Card>
  );
};
