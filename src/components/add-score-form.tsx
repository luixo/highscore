import { FC, useCallback, useEffect, useMemo } from 'react';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import {
  Button,
  Form,
  Input,
  Select,
  SelectItem,
  SharedSelection,
  Tooltip,
} from '@nextui-org/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '~/utils/trpc';
import { playerNameSchema, scoreSchema } from '~/server/schemas';
import toast from 'react-hot-toast';
import { formatScore, getInputLabel } from '~/utils/format';
import { useLocalStorageValue } from '@react-hookz/web';
import { Game } from '~/components/game';
import { collectErrors } from '~/utils/form';

const formSchema = z.strictObject({
  playerName: playerNameSchema,
  score: scoreSchema,
});

export const AddScoreForm: FC = () => {
  const trpcUtils = trpc.useUtils();
  const {
    value: gameId,
    set: setGameId,
    remove: removeGameId,
  } = useLocalStorageValue<string | undefined>('selectedGameId');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const addScoreMutation = trpc.scores.upsert.useMutation({
    onSuccess: (response, variables) => {
      const gamesCache = trpcUtils.games.list.getData();
      const matchedGame = gamesCache?.find(
        (game) => game.id === variables.gameId,
      );
      if (response.type === 'old') {
        toast.error(
          `Результат "${formatScore(variables.score, matchedGame?.formatScore ?? undefined, matchedGame?.formatters)}" для игрока "${variables.playerName}" не был добавлен, есть результат лучше: "${formatScore(response.result.score, matchedGame?.formatScore ?? undefined, matchedGame?.formatters)}"`,
        );
      } else {
        toast.success(
          `Результат "${formatScore(response.result.score, matchedGame?.formatScore ?? undefined, matchedGame?.formatters)}" для игрока "${variables.playerName}" добавлен`,
        );
      }
      form.reset();
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) => {
      if (!gameId) {
        return;
      }
      addScoreMutation.mutate({
        playerName: data.playerName,
        score: data.score,
        gameId,
      });
    },
    [addScoreMutation, gameId],
  );
  const onError = useCallback<SubmitErrorHandler<z.infer<typeof formSchema>>>(
    (errors) => toast.error(collectErrors(errors).join('\n')),
    [],
  );
  const gamesQuery = trpc.games.list.useQuery();
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
        setGameId(gamesQuery.data?.[0].id);
      } else {
        const selected = [...selection.keys()][0];
        if (gameId !== selected) {
          setGameId(selected ? selected.toString() : undefined);
        }
      }
    },
    [gameId, gamesQuery.data, setGameId],
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
      <Form onSubmit={form.handleSubmit(onSubmit, onError)} className="w-full">
        <Input
          {...form.register('playerName')}
          label="Имя игрока"
          errorMessage={form.formState.errors.playerName?.message?.toString()}
          isInvalid={Boolean(form.formState.errors.playerName?.message)}
        />
        <Input
          {...form.register('score')}
          label={getInputLabel(selectedGame?.formatters)}
          type="number"
          placeholder="74"
          errorMessage={form.formState.errors.score?.message?.toString()}
          isInvalid={Boolean(form.formState.errors.score?.message)}
        />

        <Tooltip
          isDisabled={form.formState.isValid}
          content={collectErrors(form.formState.errors)}
        >
          <div>
            <Button
              type="submit"
              color="primary"
              className="self-end"
              isDisabled={!gameId || !form.formState.isValid}
            >
              Добавить
            </Button>
          </div>
        </Tooltip>
      </Form>
      {selectedGame ? <Game game={selectedGame} /> : null}
    </div>
  );
};
