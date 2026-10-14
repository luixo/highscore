import { addToast } from "@heroui/react";
import { MutationCache, hashKey } from "@tanstack/react-query";
import type { QueryClientConfig } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { RouterContext } from "~/routes/__root";
import type { AppRouter } from "~/server/routers/_app";
import { MINUTE } from "~/utils/time";

export const queryClientConfig: QueryClientConfig = {
	defaultOptions: {
		queries: {
			refetchInterval: (query) => {
				const { queryKey } = query;
				if (
					hashKey(queryKey[0] as unknown[]) === hashKey(["moderator", "get"])
				) {
					return false;
				}
				return MINUTE;
			},
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			retry: 0,
		},
	},
	mutationCache: new MutationCache({
		onError: (error, _variables, _onMutateResult, _mutation, context) => {
			addToast({
				color: "danger",
				description: error.message,
				title: (
					context.client as RouterContext["queryClient"]
				).context.i18n.getTranslation()("common.error"),
			});
		},
	}),
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
