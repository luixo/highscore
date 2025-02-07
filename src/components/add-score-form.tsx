import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type {
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { SharedSelection } from '@nextui-org/react';
import {
  Button,
  Form,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
} from '@nextui-org/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '~/utils/trpc';
import type { EventId, inputsSchema } from '~/server/schemas';
import { playerNameSchema, scoresSchema } from '~/server/schemas';
import toast from 'react-hot-toast';
import { formatScore } from '~/utils/format';
import { Game } from '~/components/game';
import { collectErrors } from '~/utils/form';
import { useLastGame } from '~/hooks/use-last-game';
import { getAggregation, getFormatting, getInputs } from '~/utils/jsons';
import { aggregateScore } from '~/utils/aggregation';
import type { Prisma } from '@prisma/client';

const formSchema = z.strictObject({
  playerName: playerNameSchema,
  scores: scoresSchema,
});

type Form = z.infer<typeof formSchema>;

const ScoresForm: FC<{
  form: UseFormReturn<Form>;
  inputs: z.infer<typeof inputsSchema>;
}> = ({ form, inputs }) => {
  const { fields } = useFieldArray({
    control: form.control,
    name: 'scores',
  });
  return (
    <>
      {fields.map((field, index) => {
        const input = inputs[index];
        if (input.hidden) {
          return (
            <Controller
              key={field.id}
              control={form.control}
              name={`scores.${index}`}
              render={() => <div className="hidden" />}
            />
          );
        }
        return (
          <Input
            key={field.id}
            {...form.register(`scores.${index}.value`, { valueAsNumber: true })}
            label={input.description}
            type="number"
            placeholder={input.defaultValue.toString()}
            errorMessage={form.formState.errors.scores?.[
              index
            ]?.message?.toString()}
            isInvalid={Boolean(form.formState.errors.scores?.[index]?.message)}
          />
        );
      })}
    </>
  );
};

const SelectedGameForm: FC<{ game: Prisma.GameGetPayload<{}> }> = ({
  game,
}) => {
  const inputs = getInputs(game.inputs);
  const form = useForm<Form>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      scores: inputs.map((input) => ({
        type: input.type,
        key: input.key,
        value: input.defaultValue ?? undefined,
      })),
    },
  });
  const trpcUtils = trpc.useUtils();
  const addScoreMutation = trpc.scores.upsert.useMutation({
    onSuccess: (response, variables) => {
      const gamesCache = trpcUtils.games.list.getData();
      const matchedGame = gamesCache?.find(
        (game) => game.id === variables.gameId,
      );
      if (matchedGame) {
        toast.success(
          `Результат "${formatScore(aggregateScore(variables.scores, getAggregation(matchedGame.aggregation)), getFormatting(matchedGame.formatting))}" для игрока "${variables.playerName}" добавлен`,
        );
      }
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<Form>>(
    (data) => {
      addScoreMutation.mutate({
        playerName: data.playerName,
        scores: data.scores,
        gameId: game.id,
      });
    },
    [addScoreMutation, game.id],
  );
  const onError = useCallback<SubmitErrorHandler<Form>>(
    (errors) => toast.error(collectErrors(errors).join('\n')),
    [],
  );
  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit, onError)} className="w-full">
        <Input
          {...form.register('playerName')}
          label="Имя игрока"
          errorMessage={form.formState.errors.playerName?.message?.toString()}
          isInvalid={Boolean(form.formState.errors.playerName?.message)}
        />
        <ScoresForm form={form} inputs={inputs} />

        <Tooltip
          isDisabled={form.formState.isValid}
          content={collectErrors(form.formState.errors)}
        >
          <div>
            <Button
              type="submit"
              color="primary"
              className="self-end"
              isDisabled={!game.id || !form.formState.isValid}
            >
              Добавить
            </Button>
          </div>
        </Tooltip>
      </Form>
      <Game game={game} />
    </>
  );
};

export const AddScoreForm: FC<{ eventId: EventId }> = ({ eventId }) => {
  const { gameId, setGameId, removeGameId } = useLastGame(eventId);
  const gamesQuery = trpc.games.list.useQuery({ eventId });
  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);
  useEffect(() => {
    if (games.length === 0) {
      return;
    }
    if (!gameId) {
      setGameId(games[0].id);
    } else if (!games.map((game) => game.id).includes(gameId)) {
      removeGameId();
    }
  }, [gameId, games, removeGameId, setGameId]);
  const selectedGame = games.find((game) => game.id === gameId);
  const onSelectionChange = useCallback(
    (selection: SharedSelection) => {
      if (selection === 'all') {
        const firstGame = gamesQuery.data?.[0];
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
    [gameId, gamesQuery.data, removeGameId, setGameId],
  );
  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-2xl font-semibold">Добавить результат</h3>
      <Select
        label="Игра"
        placeholder="Выбери игру"
        selectedKeys={gameId ? [gameId] : []}
        variant="bordered"
        onSelectionChange={onSelectionChange}
      >
        {games.map((game) => (
          <SelectItem key={game.id} value={game.id}>
            {game.title}
          </SelectItem>
        ))}
      </Select>
      {selectedGame ? (
        <SelectedGameForm game={selectedGame} />
      ) : (
        <Spinner size="lg" />
      )}
    </div>
  );
};
