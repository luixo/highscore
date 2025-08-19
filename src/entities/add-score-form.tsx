import React from "react";

import type { Form, SharedSelection } from "@heroui/react";
import { Select, SelectItem, Skeleton, addToast } from "@heroui/react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { z } from "zod";

import { Game } from "~/entities/game";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { type AppForm, useAppForm } from "~/hooks/use-app-form";
import { useLastGame } from "~/hooks/use-last-game";
import type { EventId, inputsSchema } from "~/server/schemas";
import { playerNameSchema, scoresSchema } from "~/server/schemas";
import { aggregateScore } from "~/utils/aggregation";
import { getAllErrors } from "~/utils/form";
import { formatScore } from "~/utils/format";
import { useTRPC } from "~/utils/trpc";
import type { GameType } from "~/utils/types";

const formSchema = z.strictObject({
  playerName: playerNameSchema,
  scores: scoresSchema,
});

type Form = z.infer<typeof formSchema>;

const ScoresForm: React.FC<{
  form: AppForm<Form>;
  inputs: z.infer<typeof inputsSchema>;
  isPending: boolean;
}> = ({ form, inputs, isPending }) => (
  <form.AppField name="scores.values" mode="array">
    {(field) => (
      <>
        {field.state.value.map((fieldValue, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const input = inputs.values[index]!;
          if (input.hidden) {
            return <div key={fieldValue.key} className="hidden" />;
          }
          return (
            <field.NumberField
              key={fieldValue.key}
              label={input.description}
              placeholder={input.defaultValue.toString()}
              value={fieldValue.value}
              onValueChange={(nextValue) =>
                field.replaceValue(index, { ...fieldValue, value: nextValue })
              }
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
              isDisabled={isPending}
            />
          );
        })}
      </>
    )}
  </form.AppField>
);

const SelectedGameForm: React.FC<{ game: GameType }> = ({ game }) => {
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({
      playerName: "",
      scores: {
        values: game.inputs.values.map((input) => ({
          type: input.type,
          key: input.key,
          value: input.defaultValue ?? undefined,
        })),
      },
    }),
    [game],
  );
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      addScoreMutation.mutate({
        playerName: value.playerName,
        scores: value.scores,
        gameId: game.id,
      });
    },
    onSubmitInvalid: ({ formApi }) => {
      addToast({
        title: "Ошибка",
        description: getAllErrors(formApi),
        color: "danger",
      });
    },
  });
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const addScoreMutation = useMutation(
    trpc.scores.upsert.mutationOptions({
      onSuccess: (_res, variables) => {
        const gamesCache = queryClient.getQueryData(trpc.games.list.queryKey());
        const matchedGame = gamesCache?.find(
          (game) => game.id === variables.gameId,
        );
        if (matchedGame) {
          addToast({
            title: "Успех",
            description: `Результат "${formatScore(aggregateScore(variables.scores.values, matchedGame.aggregation), matchedGame.formatting)}" для игрока "${variables.playerName}" добавлен`,
            color: "success",
          });
        }
        form.reset(getDefaultValues());
      },
    }),
  );
  return (
    <>
      <form.AppForm>
        <form.Form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.AppField name="playerName">
            {(field) => (
              <field.TextField
                label="Имя игрока"
                value={field.state.value}
                onValueChange={field.setValue}
                name={field.name}
                onBlur={field.handleBlur}
                fieldError={
                  field.state.meta.isDirty ? field.state.meta.errors : undefined
                }
                isDisabled={addScoreMutation.isPending}
              />
            )}
          </form.AppField>
          <ScoresForm
            form={form}
            inputs={game.inputs}
            isPending={addScoreMutation.isPending}
          />
          <form.SubmitButton isDisabled={!game.id}>Добавить</form.SubmitButton>
        </form.Form>
      </form.AppForm>
      <Game game={game} />
    </>
  );
};

const AddScoreGames = suspendedFallback<{ eventId: EventId }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    const { gameId, setGameId, removeGameId } = useLastGame(eventId);
    const { data: games } = useSuspenseQuery(
      trpc.games.list.queryOptions({ eventId }),
    );
    React.useEffect(() => {
      if (games.length === 0) {
        return;
      }
      if (!gameId) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setGameId(games[0]!.id);
      } else if (!games.map((game) => game.id).includes(gameId)) {
        removeGameId();
      }
    }, [gameId, games, removeGameId, setGameId]);
    const selectedGame = games.find((game) => game.id === gameId);
    const onSelectionChange = React.useCallback(
      (selection: SharedSelection) => {
        if (selection === "all") {
          const firstGame = games[0];
          if (firstGame) {
            setGameId(firstGame.id);
          }
        } else {
          const selected = [...selection.keys()][0];
          if (gameId !== selected) {
            if (!selected) {
              removeGameId();
            } else {
              setGameId(selected.toString());
            }
          }
        }
      },
      [gameId, games, removeGameId, setGameId],
    );
    return (
      <>
        <Select
          label="Игра"
          placeholder="Выбери игру"
          selectedKeys={gameId ? [gameId] : []}
          variant="bordered"
          onSelectionChange={onSelectionChange}
        >
          {games.map((game) => (
            <SelectItem key={game.id}>{game.title}</SelectItem>
          ))}
        </Select>
        {selectedGame ? (
          <SelectedGameForm key={selectedGame.id} game={selectedGame} />
        ) : null}
      </>
    );
  },
  <Skeleton className="h-14 w-full rounded-md" />,
);

export const AddScoreForm: React.FC<{ eventId: string }> = ({ eventId }) => (
  <div className="flex flex-col items-center gap-3">
    <h3 className="text-2xl font-semibold">Добавить результат</h3>
    <AddScoreGames eventId={eventId} />
  </div>
);
