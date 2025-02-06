import type { FC } from 'react';
import type { inferProcedureOutput } from '@trpc/server';

import type { AppRouter } from '~/server/routers/_app';
import { Scores } from '~/components/scores';
import { Card, CardBody, CardHeader, Divider } from '@nextui-org/react';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import { trpc } from '~/utils/trpc';
import { RemoveButton } from '~/components/remove-button';
import { toast } from 'react-hot-toast';

export const Game: FC<{
  game: inferProcedureOutput<AppRouter['games']['list']>[number];
}> = ({ game }) => {
  const moderatorStatus = useModeratorStatus({ eventId: game.eventId });
  const removeGameMutation = trpc.games.remove.useMutation({
    onSuccess: (_result, variables) => {
      toast.success(`Игра "${variables.id}" удалена.`);
    },
  });
  return (
    <Card className="min-h-[250px] w-[320px] lg:w-[240px]">
      <CardHeader className="relative flex h-[50px] justify-end gap-2 overflow-hidden">
        <img
          className="absolute inset-0 -z-20 w-full"
          src={game.logoUrl}
          alt={game.title}
        />
        {moderatorStatus === 'Admin' ? (
          <RemoveButton
            onClick={() =>
              removeGameMutation.mutate({ eventId: game.eventId, id: game.id })
            }
          />
        ) : null}
      </CardHeader>
      <Divider />
      <CardBody className="max-h-[220px] px-2">
        <Scores game={game} />
      </CardBody>
    </Card>
  );
};
