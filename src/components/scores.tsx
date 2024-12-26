import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react';
import { CiMedal } from 'react-icons/ci';
import { inferProcedureOutput } from '@trpc/server';
import { FC, useCallback } from 'react';

import type { AppRouter } from '~/server/routers/_app';
import { trpc } from '~/utils/trpc';
import { usePusher } from '~/hooks/use-pusher';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import { formatScore } from '~/utils/format';
import { RemoveButton } from '~/components/remove-button';

const columns = [{ key: 'medal' }, { key: 'names' }, { key: 'score' }];
const moderatorColumns = [...columns, { key: 'actions' }];

type PackedScore = {
  score: number;
  index: number;
  players: inferProcedureOutput<AppRouter['scores']['list']>;
};

export const Scores: FC<{
  gameId: string;
}> = ({ gameId }) => {
  const trpcUtils = trpc.useUtils();
  const gamesQuery = trpc.games.list.useQuery();
  const scoresQuery = trpc.scores.list.useQuery({ gameId });
  usePusher('score:added', ({ score: newScore, gameId: scoreGameId }) => {
    if (scoreGameId !== gameId) {
      return;
    }
    trpcUtils.scores.list.setData({ gameId }, (prevData) => {
      if (!prevData) {
        return;
      }
      const matchedIndex = prevData.findIndex(
        (element) =>
          element.playerName.toLowerCase() ===
          newScore.playerName.toLowerCase(),
      );
      if (matchedIndex === -1) {
        return [...prevData, newScore];
      }
      return [
        ...prevData.slice(0, matchedIndex),
        newScore,
        ...prevData.slice(matchedIndex + 1),
      ];
    });
  });
  usePusher('score:removed', ({ playerName, gameId: scoreGameId }) => {
    if (scoreGameId !== gameId) {
      return;
    }
    trpcUtils.scores.list.setData({ gameId }, (prevData) => {
      if (!prevData) {
        return;
      }
      return prevData.filter(
        (element) =>
          element.playerName.toLowerCase() !== playerName.toLowerCase(),
      );
    });
  });
  const moderatorStatus = useModeratorStatus();
  const removeScoreMutation = trpc.scores.remove.useMutation();
  const renderCell = useCallback(
    (packedScore: PackedScore, columnKey: React.Key) => {
      switch (columnKey) {
        case 'medal':
          if (packedScore.index < 3) {
            return (
              <CiMedal
                size={20}
                color={
                  packedScore.index === 0
                    ? 'gold'
                    : packedScore.index === 1
                      ? 'silver'
                      : 'saddlebrown'
                }
              />
            );
          } else {
            return null;
          }
        case 'names':
          return (
            <div className="flex flex-col">
              {packedScore.players.map((player, index, players) => (
                <span>
                  {player.playerName}
                  {index === players.length - 1 ? '' : ','}
                  {packedScore.players.length !== 1 && moderatorStatus ? (
                    <RemoveButton
                      onClick={() =>
                        removeScoreMutation.mutate({
                          gameId,
                          playerName: player.playerName,
                        })
                      }
                    />
                  ) : null}
                </span>
              ))}
            </div>
          );
        case 'score':
          const matchedGame = gamesQuery.data?.find(
            (game) => game.id === gameId,
          );
          return (
            <div>{formatScore(packedScore.score, matchedGame?.formatters)}</div>
          );
        case 'actions':
          return (
            <RemoveButton
              isDisabled={packedScore.players.length !== 1}
              onClick={() =>
                removeScoreMutation.mutate({
                  gameId,
                  playerName: packedScore.players[0].playerName,
                })
              }
            />
          );
        default:
          return null;
      }
    },
    [gameId, gamesQuery.data, moderatorStatus, removeScoreMutation],
  );
  switch (scoresQuery.status) {
    case 'pending':
      return <Spinner />;
    case 'error':
      return <Button color="warning">{scoresQuery.error.message}</Button>;
    case 'success':
      const data = [...scoresQuery.data].sort((a, b) => b.score - a.score);
      const packedData = data.reduce<PackedScore[]>((acc, element) => {
        const lastElement = acc.pop();
        if (!lastElement) {
          return [{ index: 0, score: element.score, players: [element] }];
        }
        if (lastElement.score !== element.score) {
          return [
            ...acc,
            lastElement,
            { index: acc.length + 1, score: element.score, players: [element] },
          ];
        }
        return [
          ...acc,
          { ...lastElement, players: [...lastElement.players, element] },
        ];
      }, []);
      return (
        <Table
          hideHeader
          removeWrapper
          isStriped
          isCompact
          classNames={{
            tr: 'border-b last:border-none',
          }}
        >
          <TableHeader columns={moderatorStatus ? moderatorColumns : columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.key}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={packedData}
            emptyContent="Результатов пока нет, сыграй в эту игру!"
          >
            {(item) => (
              <TableRow key={item.score}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
  }
};
