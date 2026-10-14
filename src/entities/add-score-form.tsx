import React from "react";
import type { SharedSelection } from "@heroui/react";
import { Select, SelectItem, Skeleton, addToast } from "@heroui/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { Game } from "~/entities/game";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useAppForm } from "~/hooks/use-app-form";
import type { AppForm } from "~/hooks/use-app-form";
import { useLastGame } from "~/hooks/use-last-game";
import type { EventId, inputsSchema } from "~/server/schemas";
import { playerNameSchema, scoresSchema } from "~/server/schemas";
import { aggregateScore } from "~/utils/aggregation";
import { getAllErrors } from "~/utils/form";
import { formatScore } from "~/utils/format";
import { useTranslation } from "~/utils/i18n";
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
					// oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
					const input = inputs.values[index]!;
					if (input.hidden === true) {
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
	const { t, language } = useTranslation();
	const getDefaultValues = React.useCallback(
		(): z.infer<typeof formSchema> => ({
			playerName: "",
			scores: {
				values: game.inputs.values.map((input) => ({
					key: input.key,
					type: input.type,
					value: input.defaultValue,
				})),
			},
		}),
		[game],
	);
	const form = useAppForm({
		defaultValues: getDefaultValues(),
		onSubmit: ({ value }) => {
			const playerNames = value.playerName
				.split(",")
				.map((name) => name.trim());
			for (const playerName of playerNames) {
				// oxlint-disable-next-line no-use-before-define
				addScoreMutation.mutate({
					gameId: game.id,
					playerName,
					scores: value.scores,
				});
			}
		},
		onSubmitInvalid: ({ formApi }) => {
			addToast({
				color: "danger",
				description: getAllErrors(formApi),
				title: t("common.error"),
			});
		},
		validators: {
			onChange: formSchema,
		},
	});
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const addScoreMutation = useMutation(
		trpc.scores.upsert.mutationOptions({
			onSuccess: (_res, variables) => {
				const gamesCache = queryClient.getQueryData(trpc.games.list.queryKey());
				const matchedGame = gamesCache?.find(
					({ id }) => id === variables.gameId,
				);
				if (matchedGame) {
					addToast({
						color: "success",
						description: t("addScore.toast.description", {
							player: variables.playerName,
							score: formatScore(
								aggregateScore(
									variables.scores.values,
									matchedGame.aggregation,
								),
								matchedGame.formatting,
								{ language },
							),
						}),
						title: t("common.success"),
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
						void form.handleSubmit();
					}}
				>
					<form.AppField name="playerName">
						{(field) => (
							<field.TextField
								label={t("addScore.form.player.label")}
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
					<form.SubmitButton isDisabled={!game.id}>
						{t("addScore.form.button")}
					</form.SubmitButton>
				</form.Form>
			</form.AppForm>
			<Game game={game} />
		</>
	);
};

const AddScoreGames = suspendedFallback<{ eventId: EventId }>(
	({ eventId }) => {
		const { t } = useTranslation();
		const trpc = useTRPC();
		const { gameId, setGameId, removeGameId } = useLastGame(eventId);
		const { data: games } = useSuspenseQuery(
			trpc.games.list.queryOptions({ eventId }),
		);
		React.useEffect(() => {
			if (games.length === 0) {
				return;
			}
			if (gameId === undefined) {
				// oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
				setGameId(games[0]!.id);
			} else if (!games.map((game) => game.id).includes(gameId)) {
				removeGameId();
			}
		}, [gameId, games, removeGameId, setGameId]);
		const selectedGame = games.find((game) => game.id === gameId);
		const onSelectionChange = React.useCallback(
			(selection: SharedSelection) => {
				if (selection === "all") {
					const [firstGame] = games;
					if (firstGame) {
						setGameId(firstGame.id);
					}
				} else {
					const [selected] = [...selection.keys()];
					if (gameId !== selected) {
						if (selected === undefined) {
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
					label={t("addScore.game.label")}
					placeholder={t("addScore.game.placeholder")}
					selectedKeys={gameId === undefined ? [] : [gameId]}
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

export const AddScoreForm: React.FC<{ eventId: string }> = ({ eventId }) => {
	const { t } = useTranslation();
	return (
		<div className="flex flex-col items-center gap-3">
			<h3 className="text-2xl font-semibold">{t("addScore.title")}</h3>
			<AddScoreGames eventId={eventId} />
		</div>
	);
};
