import React from "react";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from "@heroui/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { CiMedal } from "react-icons/ci";
import { useInterval } from "usehooks-ts";
import type { z } from "zod";

import { RemoveButton } from "~/components/remove-button";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useModeratorStatus } from "~/hooks/use-moderator-status";
import { useSubscription } from "~/hooks/use-subscription";
import type { scoresSchema } from "~/server/schemas";
import { aggregateScore } from "~/utils/aggregation";
import { formatScore } from "~/utils/format";
import { useTRPC } from "~/utils/trpc";
import type { GameType, ScoreType } from "~/utils/types";

const columns = [{ key: "medal" }, { key: "names" }, { key: "score" }];
const moderatorColumns = [...columns, { key: "actions" }];

const RenamePlayerModal: React.FC<{
  gameId: string;
  playerName: string | undefined;
  onClose: () => void;
}> = ({ gameId, playerName, onClose }) => {
  const trpc = useTRPC();
  const [localName, setLocalName] = React.useState<string>();
  React.useEffect(() => {
    if (playerName) {
      setLocalName(playerName);
    }
  }, [playerName]);
  const updateNameMutation = useMutation(
    trpc.scores.update.mutationOptions({
      onSuccess: (_result, variables) => {
        addToast({
          title: "Успех",
          description: `Имя игрока "${variables.playerName}" обновлено: "${variables.playerName}"`,
          color: "success",
        });
      },
    }),
  );
  const saveLocalPlayerName = React.useCallback(() => {
    if (!playerName || !localName) {
      return;
    }
    onClose();
    updateNameMutation.mutate({
      playerName: playerName,
      gameId,
      updateObject: {
        type: "playerName",
        playerName: localName,
      },
    });
  }, [playerName, localName, onClose, updateNameMutation, gameId]);
  return (
    <Modal isOpen={Boolean(playerName)} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>{`Переименовать игрока "${playerName}"`}</ModalHeader>
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

const ChangePlayerScoreModal: React.FC<{
  game: GameType;
  player:
    | {
        name: string;
        scores: z.infer<typeof scoresSchema>["values"];
      }
    | undefined;
  onClose: () => void;
}> = ({ game, player, onClose }) => {
  const trpc = useTRPC();
  const [localScores, setLocalScores] = React.useState<
    z.infer<typeof scoresSchema>["values"]
  >(player?.scores ?? []);
  React.useEffect(() => {
    if (player) {
      setLocalScores(player.scores);
    }
  }, [player]);
  const updateScoreMutation = useMutation(
    trpc.scores.update.mutationOptions({
      onSuccess: (result, variables) => {
        addToast({
          title: "Успех",
          description: `Рекорд игрока "${variables.playerName}" обновлен: ${aggregateScore(result.values, game.aggregation)}`,
          color: "success",
        });
      },
    }),
  );
  const saveLocalPlayerName = React.useCallback(() => {
    if (!player || !localScores) {
      return;
    }
    onClose();
    updateScoreMutation.mutate({
      playerName: player.name,
      gameId: game.id,
      updateObject: {
        type: "scores",
        scores: localScores,
      },
    });
  }, [player, localScores, onClose, updateScoreMutation, game.id]);
  if (!player) {
    return null;
  }
  return (
    <Modal isOpen onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>{`Изменить очки игрока "${player.name}"`}</ModalHeader>
        <ModalBody className="w-full">
          {localScores.map((localScore, index) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const input = game.inputs.values[index]!;
            return (
              <Input
                key={localScore.key}
                value={localScore.value.toString()}
                label={input.description}
                onValueChange={(value) => {
                  const numValue = Number(value);
                  if (Number.isNaN(numValue)) {
                    return;
                  }
                  setLocalScores((prevLocalScores) => [
                    ...prevLocalScores.slice(0, index),
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    { ...prevLocalScores[index]!, value: Number(value) },
                    ...prevLocalScores.slice(index + 1),
                  ]);
                }}
                type="number"
              />
            );
          })}
          <Button
            color="primary"
            onPress={saveLocalPlayerName}
            isDisabled={Object.keys(localScores).length === 0}
          >
            Сохранить
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const RecordInfoModal: React.FC<{
  record: PackedScore | undefined;
  onClose: () => void;
}> = ({ record, onClose }) => (
  <Modal isOpen={Boolean(record)} onOpenChange={onClose}>
    <ModalContent>
      <ModalHeader>Информация о достижении</ModalHeader>
      <ModalBody className="w-full">
        <Table>
          <TableHeader
            columns={[
              {
                key: "score",
                label: "Очки",
              },
              {
                key: "playerName",
                label: "Имя игрока",
              },
              {
                key: "createdAt",
                label: "Первый результат",
              },
              {
                key: "updatedAt",
                label: "Последний результат",
              },
              {
                key: "moderator",
                label: "Поставил",
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
                        : typeof value === "object"
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

const getColor = (delta: number) => {
  if (delta < 15 * 1000) {
    return "bg-success-400/100";
  } else if (delta < 45 * 1000) {
    return "bg-success-400/80";
  } else if (delta < 75 * 1000) {
    return "bg-success-400/60";
  } else if (delta < 120 * 1000) {
    return "bg-success-400/40";
  } else if (delta < 200 * 1000) {
    return "bg-success-400/20";
  } else if (delta < 300 * 1000) {
    return "bg-success-400/10";
  }
  return;
};

const ScoreBoard: React.FC<{
  rawData: ScoreType[];
  game: GameType;
}> = ({ game, rawData: scores }) => {
  const trpc = useTRPC();
  const aggregatedData = scores.map((score) => ({
    scores: score.values,
    score: aggregateScore(score.values, game.aggregation),
    playerName: score.playerName,
    updatedAt: score.updatedAt,
  }));
  const sortedData = aggregatedData.sort((a, b) => {
    if (game.sort.direction === "desc") {
      return b.score - a.score;
    } else {
      return a.score - b.score;
    }
  });
  const packedData = sortedData.reduce<PackedScore[]>((acc, element) => {
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
  const [now, setNow] = React.useState(Date.now());
  useInterval(() => {
    setNow(Date.now());
  }, 1000);

  const moderatorStatus = useModeratorStatus({ eventId: game.eventId });
  const removeScoreMutation = useMutation(
    trpc.scores.remove.mutationOptions({
      onSuccess: (_result, variables) => {
        addToast({
          title: "Успех",
          description: `Рекорд игрока "${variables.playerName}" удален.`,
          color: "success",
        });
      },
    }),
  );
  const [editPlayerNameModal, setEditPlayerNameModal] =
    React.useState<string>();
  const [editPlayerScoreModal, setEditPlayerScoreModal] = React.useState<{
    name: string;
    scores: z.infer<typeof scoresSchema>["values"];
  }>();
  const [showInfoRecord, setShowInfoRecord] = React.useState<PackedScore>();
  const renderCell = React.useCallback(
    (packedScore: PackedScore, columnKey: React.Key) => {
      switch (columnKey) {
        case "medal": {
          const onClick = () => {
            if (moderatorStatus !== "admin") {
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
                      ? "gold"
                      : packedScore.index === 1
                        ? "silver"
                        : "saddlebrown"
                  }
                  onClick={onClick}
                  className="stroke-1"
                />
              </div>
            );
          } else {
            return <div onClick={onClick}></div>;
          }
        }
        case "names":
          return (
            <div className="flex flex-col">
              {packedScore.players.map((player, index, players) => (
                <span key={player.playerName} className="inline-flex gap-1">
                  <div
                    onClick={() => {
                      if (moderatorStatus !== "admin") {
                        return;
                      }
                      setEditPlayerNameModal(player.playerName);
                    }}
                    className={
                      moderatorStatus === "admin" ? "cursor-pointer" : undefined
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
                  {index === players.length - 1 ? "" : ","}
                </span>
              ))}
            </div>
          );
        case "score": {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const firstPlayer = packedScore.players[0]!;
          return (
            <div
              onClick={() => {
                if (
                  moderatorStatus !== "admin" ||
                  packedScore.players.length !== 1
                ) {
                  return;
                }
                setEditPlayerScoreModal({
                  name: firstPlayer.playerName,
                  scores: firstPlayer.scores,
                });
              }}
              className={
                moderatorStatus !== "admin" || packedScore.players.length !== 1
                  ? undefined
                  : "cursor-pointer"
              }
            >
              {formatScore(packedScore.score, game.formatting)}
            </div>
          );
        }
        case "actions":
          return (
            <RemoveButton
              isDisabled={packedScore.players.length !== 1}
              onClick={() =>
                removeScoreMutation.mutate({
                  gameId: game.id,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  playerName: packedScore.players[0]!.playerName,
                })
              }
            />
          );
        default:
          return null;
      }
    },
    [game.formatting, game.id, moderatorStatus, removeScoreMutation],
  );
  return (
    <>
      <Table
        hideHeader
        removeWrapper
        isStriped
        isCompact
        aria-label="Таблица результатов"
        classNames={{
          tr: "border-b last:border-none",
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
                className={["transition-colors", getColor(now - maxUpdatedAt)]
                  .filter(Boolean)
                  .join(" ")}
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
        game={game}
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
  players: (Pick<ScoreType, "playerName" | "updatedAt"> & {
    score: number;
    scores: z.infer<typeof scoresSchema>["values"];
  })[];
};

const ScoresInner: React.FC<{
  game: GameType;
}> = suspendedFallback(
  ({ game }) => {
    const trpc = useTRPC();
    const { data: scores } = useSuspenseQuery(
      trpc.scores.list.queryOptions({ gameId: game.id }),
    );
    return <ScoreBoard game={game} rawData={scores} />;
  },
  Array.from({ length: 3 }).map((_, index) => (
    <Skeleton
      key={index}
      className="h-8 w-full not-last:border-b first:rounded-t-sm last:rounded-b-sm"
    />
  )),
);

export const Scores: React.FC<{
  game: GameType;
}> = ({ game }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  useSubscription(
    "score:upsert",
    ({ score: upsertedScore, playerName, gameId: scoreGameId }) => {
      if (scoreGameId !== game.id) {
        return;
      }
      queryClient.setQueryData(
        trpc.scores.list.queryKey({ gameId: game.id }),
        (prevData) => {
          if (!prevData) {
            return;
          }
          const nextScore = {
            ...upsertedScore,
            playerName,
          };
          const matchedIndex = prevData.findIndex(
            (element) => element.playerName === playerName,
          );
          if (matchedIndex === -1) {
            return [...prevData, nextScore];
          }
          return [
            ...prevData.slice(0, matchedIndex),
            nextScore,
            ...prevData.slice(matchedIndex + 1),
          ];
        },
      );
    },
  );
  useSubscription("score:removed", ({ playerName, gameId: scoreGameId }) => {
    if (scoreGameId !== game.id) {
      return;
    }
    queryClient.setQueryData(
      trpc.scores.list.queryKey({ gameId: game.id }),
      (prevData) => {
        if (!prevData) {
          return;
        }
        return prevData.filter((element) => element.playerName !== playerName);
      },
    );
  });
  return <ScoresInner game={game} />;
};
