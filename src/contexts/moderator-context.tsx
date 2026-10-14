import type { Dispatch, FC, PropsWithChildren, SetStateAction } from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "remeda";
import type { EventId, GameId } from "~/server/schemas";
import { YEAR } from "~/utils/time";
import { useTRPC } from "~/utils/trpc";

export const MODERATOR_COOKIE_KEYS = "moderator-keys";

type StateReturn<S> = [S, Dispatch<SetStateAction<S>>];

type Keys = Record<EventId, GameId>;

export const ModeratorContext = createContext<StateReturn<Keys>>([
	{},
	// oxlint-disable-next-line @typescript-eslint/no-empty-function
	() => {},
]);

export const ModeratorProvider: FC<
	PropsWithChildren<{ initialKeys: Keys }>
> = ({ initialKeys, children }) => {
	const [moderatorKeys, setModeratorKeys] = useState(initialKeys);
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const moderatorQueryFilter = trpc.moderator.get.queryFilter();
	useEffect(() => {
		const isEmpty = keys(moderatorKeys).length === 0;
		void cookieStore.set({
			expires: isEmpty ? Date.now() - 1 : Date.now() + YEAR,
			name: MODERATOR_COOKIE_KEYS,
			path: "/",
			sameSite: "strict",
			value: isEmpty ? "" : JSON.stringify(moderatorKeys),
		});
		void queryClient.invalidateQueries(moderatorQueryFilter);
	}, [moderatorKeys, queryClient, moderatorQueryFilter]);
	const moderatorState = useMemo(
		() =>
			[moderatorKeys, setModeratorKeys] as StateReturn<typeof moderatorKeys>,
		[moderatorKeys],
	);
	return <ModeratorContext value={moderatorState}>{children}</ModeratorContext>;
};
