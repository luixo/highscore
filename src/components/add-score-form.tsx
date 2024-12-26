import { FC, useCallback, useEffect, useMemo } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button, Form, Input, Select, SelectItem } from '@nextui-org/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '~/utils/trpc';
import { playerNameSchema, scoreSchema } from '~/server/schemas';
import toast from 'react-hot-toast';
import { formatScore, getInputLabel } from '~/utils/format';
import { useLocalStorageValue } from '@react-hookz/web';
import { Game } from '~/components/game';

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
  });
  const addScoreMutation = trpc.scores.upsert.useMutation({
    onSuccess: (result, variables) => {
      const gamesCache = trpcUtils.games.list.getData();
      const matchedGame = gamesCache?.find((game) => game.id === result.gameId);
      toast.success(
        `Результат ${formatScore(result.score, matchedGame?.formatters)} для игрока "${variables.playerName}" добавлен`,
      );
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
  const gamesQuery = trpc.games.list.useQuery();
  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);
  useEffect(() => {
    if (games.length !== 0) {
      if (!gameId) {
        setGameId(games[0].id);
      } else if (!games.map((game) => game.id).includes(gameId)) {
        removeGameId();
      }
    }
  }, [gameId, games, removeGameId, setGameId]);
  const selectedGame = games.find((game) => game.id === gameId);
  return (
    <div className="flex flex-col items-center gap-3">
      <Form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <h3 className="text-2xl font-semibold">Добавить результат</h3>
        <Select
          label="Игра"
          placeholder="Выбери игру"
          selectedKeys={gameId ? [gameId] : []}
          variant="bordered"
          onSelectionChange={(selection) => {
            if (selection === 'all') {
              setGameId(gamesQuery.data?.[0].id);
            } else {
              const selected = [...selection.keys()][0];
              setGameId(selected ? selected.toString() : undefined);
            }
          }}
        >
          {(gamesQuery.data ?? []).map((game) => (
            <SelectItem key={game.id} value={game.id}>
              {game.title}
            </SelectItem>
          ))}
        </Select>
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
          placeholder={
            selectedGame
              ? formatScore(9999, selectedGame.formatters)
              : undefined
          }
          errorMessage={form.formState.errors.score?.message?.toString()}
          isInvalid={Boolean(form.formState.errors.score?.message)}
        />
        <Button
          type="submit"
          color="primary"
          className="self-end"
          isDisabled={!gameId}
        >
          Добавить
        </Button>
      </Form>
      {selectedGame ? <Game game={selectedGame} /> : null}
    </div>
  );
};
