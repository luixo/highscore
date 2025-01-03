import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
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
import { FC, useCallback, useEffect, useState } from 'react';

import type { AppRouter } from '~/server/routers/_app';
import { trpc } from '~/utils/trpc';
import { usePusher } from '~/hooks/use-pusher';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import { formatScore } from '~/utils/format';
import { RemoveButton } from '~/components/remove-button';
import { toast } from 'react-hot-toast';
import { useIntervalEffect } from '@react-hookz/web';

const columns = [{ key: 'medal' }, { key: 'names' }, { key: 'score' }];
const moderatorColumns = [...columns, { key: 'actions' }];

const RenamePlayerModal: FC<{
  gameId: string;
  playerName: string | undefined;
  onClose: () => void;
}> = ({ gameId, playerName, onClose }) => {
  const [localName, setLocalName] = useState<string>();
  useEffect(() => {
    if (playerName) {
      setLocalName(playerName);
    }
  }, [playerName]);
  const updateScoreMutation = trpc.scores.update.useMutation({
    onSuccess: (_result, variables) => {
      toast.success(
        `Рекорд игрока "${variables.playerName}" обновлен: "${JSON.stringify(variables.updateObject)}"`,
      );
    },
  });
  const saveLocalPlayerName = useCallback(() => {
    if (!playerName || !localName) {
      return;
    }
    onClose();
    updateScoreMutation.mutate({
      playerName: playerName,
      gameId,
      updateObject: {
        type: 'playerName',
        playerName: localName,
      },
    });
  }, [playerName, localName, onClose, updateScoreMutation, gameId]);
  return (
    <Modal isOpen={Boolean(playerName)} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Переименовать игрока "{playerName}"</ModalHeader>
        <ModalBody className="w-full">
          <Input value={localName} onValueChange={setLocalName} />
          <Button
            color="primary"
            onPress={saveLocalPlayerName}
            isDisabled={!localName}
          >
            Сохранить
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const ChangePlayerScoreModal: FC<{
  gameId: string;
  player:
    | {
        name: string;
        score: number;
      }
    | undefined;
  onClose: () => void;
}> = ({ gameId, player, onClose }) => {
  const [localScore, setLocalScore] = useState<number>(player?.score ?? 0);
  useEffect(() => {
    if (player) {
      setLocalScore(player.score);
    }
  }, [player]);
  const updateScoreMutation = trpc.scores.update.useMutation({
    onSuccess: (_result, variables) => {
      toast.success(
        `Рекорд игрока "${variables.playerName}" обновлен: "${JSON.stringify(variables.updateObject)}"`,
      );
    },
  });
  const saveLocalPlayerName = useCallback(() => {
    if (!player || !localScore) {
      return;
    }
    onClose();
    updateScoreMutation.mutate({
      playerName: player.name,
      gameId,
      updateObject: {
        type: 'score',
        score: localScore,
      },
    });
  }, [player, localScore, onClose, updateScoreMutation, gameId]);
  if (!player) {
    return null;
  }
  return (
    <Modal isOpen onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Изменить очки игрока "{player.name}"</ModalHeader>
        <ModalBody className="w-full">
          <Input
            value={localScore.toString()}
            onValueChange={(value) => setLocalScore(Number(value))}
            type="number"
          />
          <Button
            color="primary"
            onPress={saveLocalPlayerName}
            isDisabled={!localScore}
          >
            Сохранить
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const RecordInfoModal: FC<{
  record: PackedScore | undefined;
  onClose: () => void;
}> = ({ record, onClose }) => {
  return (
    <Modal isOpen={Boolean(record)} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Информация о достижении</ModalHeader>
        <ModalBody className="w-full">
          <Table>
            <TableHeader
              columns={[
                {
                  key: 'score',
                  label: 'Очки',
                },
                {
                  key: 'playerName',
                  label: 'Имя игрока',
                },
                {
                  key: 'createdAt',
                  label: 'Первый результат',
                },
                {
                  key: 'updatedAt',
                  label: 'Последний результат',
                },
                {
                  key: 'moderator',
                  label: 'Поставил',
                },
              ]}
            >
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={record?.players ?? []}
              emptyContent="Результатов пока нет, сыграй в эту игру!"
            >
              {(player) => (
                <TableRow key={player.score}>
                  {(columnKey) => {
                    // @ts-expect-error We don't care much
                    const value = player[columnKey as keyof player];
                    return (
                      <TableCell className="px-2">
                        {value instanceof Date
                          ? value.toLocaleTimeString()
                          : typeof value === 'object'
                            ? value.name
                            : String(value)}
                      </TableCell>
                    );
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const getColor = (delta: number) => {
  if (delta < 15 * 1000) {
    return 'bg-green-500';
  } else if (delta < 45 * 1000) {
    return 'bg-green-400';
  } else if (delta < 75 * 1000) {
    return 'bg-green-300';
  } else if (delta < 120 * 1000) {
    return 'bg-green-200';
  } else if (delta < 200 * 1000) {
    return 'bg-green-100';
  } else if (delta < 300 * 1000) {
    return 'bg-green-50';
  }
  return;
};

const ScoreBoard: FC<{
  rawData: inferProcedureOutput<AppRouter['scores']['list']>;
  game: inferProcedureOutput<AppRouter['games']['list']>[number];
}> = ({ game, rawData }) => {
  const data = [...rawData].sort((a, b) => {
    if (game.sortDirection === 'Desc') {
      return b.score - a.score;
    } else {
      return a.score - b.score;
    }
  });
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
  const [now, setNow] = useState(Date.now());
  useIntervalEffect(() => {
    setNow(Date.now());
  }, 1000);

  const moderatorStatus = useModeratorStatus();
  const removeScoreMutation = trpc.scores.remove.useMutation({
    onSuccess: (_result, variables) => {
      toast.success(`Рекорд игрока "${variables.playerName}" удален.`);
    },
  });
  const [editPlayerNameModal, setEditPlayerNameModal] = useState<string>();
  const [editPlayerScoreModal, setEditPlayerScoreModal] = useState<{
    name: string;
    score: number;
  }>();
  const [showInfoRecord, setShowInfoRecord] = useState<PackedScore>();
  const renderCell = useCallback(
    (packedScore: PackedScore, columnKey: React.Key) => {
      switch (columnKey) {
        case 'medal':
          const onClick = () => {
            if (moderatorStatus !== 'Admin') {
              return;
            }
            setShowInfoRecord(packedScore);
          };
          if (packedScore.index < 3) {
            return (
              <div className="flex size-6 items-center justify-center rounded-full bg-white">
                <CiMedal
                  size={20}
                  color={
                    packedScore.index === 0
                      ? 'gold'
                      : packedScore.index === 1
                        ? 'silver'
                        : 'saddlebrown'
                  }
                  onClick={onClick}
                  className="stroke-1"
                />
              </div>
            );
          } else {
            return <div onClick={onClick}></div>;
          }
        case 'names':
          return (
            <div className="flex flex-col">
              {packedScore.players.map((player, index, players) => (
                <span className="inline-flex gap-1">
                  <div
                    onClick={() => {
                      if (moderatorStatus !== 'Admin') {
                        return;
                      }
                      setEditPlayerNameModal(player.playerName);
                    }}
                    className={
                      moderatorStatus === 'Admin' ? 'cursor-pointer' : undefined
                    }
                  >
                    {player.playerName}
                  </div>
                  {packedScore.players.length !== 1 && moderatorStatus ? (
                    <RemoveButton
                      onClick={() =>
                        removeScoreMutation.mutate({
                          gameId: game.id,
                          playerName: player.playerName,
                        })
                      }
                    />
                  ) : null}
                  {index === players.length - 1 ? '' : ','}
                </span>
              ))}
            </div>
          );
        case 'score':
          const firstPlayer = packedScore.players[0];
          return (
            <div
              onClick={() => {
                if (
                  moderatorStatus !== 'Admin' ||
                  packedScore.players.length !== 1
                ) {
                  return;
                }
                setEditPlayerScoreModal({
                  name: firstPlayer.playerName,
                  score: firstPlayer.score,
                });
              }}
              className={
                moderatorStatus !== 'Admin' || packedScore.players.length !== 1
                  ? undefined
                  : 'cursor-pointer'
              }
            >
              {formatScore(
                packedScore.score,
                game.formatScore ?? undefined,
                game.formatters,
              )}
            </div>
          );
        case 'actions':
          return (
            <RemoveButton
              isDisabled={packedScore.players.length !== 1}
              onClick={() =>
                removeScoreMutation.mutate({
                  gameId: game.id,
                  playerName: packedScore.players[0].playerName,
                })
              }
            />
          );
        default:
          return null;
      }
    },
    [
      game.formatScore,
      game.formatters,
      game.id,
      moderatorStatus,
      removeScoreMutation,
    ],
  );
  return (
    <>
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
          {(column) => <TableColumn key={column.key}>{column.key}</TableColumn>}
        </TableHeader>
        <TableBody
          items={packedData}
          emptyContent="Результатов пока нет, сыграй в эту игру!"
        >
          {(item) => {
            const maxUpdatedAt = item.players.reduce(
              (acc, player) => Math.max(player.updatedAt.valueOf(), acc),
              0,
            );
            return (
              <TableRow
                key={item.score}
                className={['transition-colors', getColor(now - maxUpdatedAt)]
                  .filter(Boolean)
                  .join(' ')}
              >
                {(columnKey) => (
                  <TableCell className="px-2 first:rounded-l-lg last:rounded-r-lg">
                    {renderCell(item, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
      <RenamePlayerModal
        gameId={game.id}
        playerName={editPlayerNameModal}
        onClose={() => setEditPlayerNameModal(undefined)}
      />
      <ChangePlayerScoreModal
        gameId={game.id}
        player={editPlayerScoreModal}
        onClose={() => setEditPlayerScoreModal(undefined)}
      />
      <RecordInfoModal
        record={showInfoRecord}
        onClose={() => setShowInfoRecord(undefined)}
      />
    </>
  );
};

type PackedScore = {
  score: number;
  index: number;
  players: inferProcedureOutput<AppRouter['scores']['list']>;
};

export const Scores: FC<{
  game: inferProcedureOutput<AppRouter['games']['list']>[number];
}> = ({ game }) => {
  const trpcUtils = trpc.useUtils();
  const scoresQuery = trpc.scores.list.useQuery({ gameId: game.id });
  usePusher('score:added', ({ score: newScore, gameId: scoreGameId }) => {
    if (scoreGameId !== game.id) {
      return;
    }
    trpcUtils.scores.list.setData({ gameId: game.id }, (prevData) => {
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
    if (scoreGameId !== game.id) {
      return;
    }
    trpcUtils.scores.list.setData({ gameId: game.id }, (prevData) => {
      if (!prevData) {
        return;
      }
      return prevData.filter(
        (element) =>
          element.playerName.toLowerCase() !== playerName.toLowerCase(),
      );
    });
  });
  usePusher(
    'score:updated',
    ({ playerName, gameId: scoreGameId, updateObject }) => {
      if (scoreGameId !== game.id) {
        return;
      }
      trpcUtils.scores.list.setData({ gameId: game.id }, (prevData) => {
        if (!prevData) {
          return;
        }
        const matchedIndex = prevData.findIndex(
          (element) =>
            element.playerName.toLowerCase() === playerName.toLowerCase(),
        );
        if (matchedIndex === -1) {
          return prevData;
        }
        return [
          ...prevData.slice(0, matchedIndex),
          {
            ...prevData[matchedIndex],
            ...(updateObject.type === 'playerName'
              ? { playerName: updateObject.playerName }
              : { score: updateObject.score }),
          },
          ...prevData.slice(matchedIndex + 1),
        ];
      });
    },
  );
  switch (scoresQuery.status) {
    case 'pending':
      return <Spinner />;
    case 'error':
      return <Button color="warning">{scoresQuery.error.message}</Button>;
    case 'success':
      return <ScoreBoard game={game} rawData={scoresQuery.data} />;
  }
};
