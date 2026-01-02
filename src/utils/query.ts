import { addToast } from "@heroui/react";
import {
  MutationCache,
  type QueryClientConfig,
  hashKey,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { RouterContext } from "~/routes/__root";
import type { AppRouter } from "~/server/routers/_app";
import { MINUTE } from "~/utils/time";

export const queryClientConfig: QueryClientConfig = {
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, _mutation, context) => {
      addToast({
        title: (
          context.client as RouterContext["queryClient"]
        ).context.i18n.getTranslation()("common.error"),
        description: error.message,
        color: "danger",
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 0,
      refetchInterval: (query) => {
        const queryKey = query.queryKey;
        if (
          hashKey(queryKey) ===
          hashKey([["moderator", "get"], { type: "query" }])
        ) {
          return false;
        }
        return MINUTE;
      },
    },
  },
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
