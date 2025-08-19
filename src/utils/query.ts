import { addToast } from "@heroui/react";
import {
  MutationCache,
  type QueryClientConfig,
  hashKey,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "~/server/routers/_app";

export const queryClientConfig: QueryClientConfig = {
  mutationCache: new MutationCache({
    onError: (error) => {
      addToast({
        title: "Ошибка",
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
        return 60 * 1000;
      },
    },
  },
};

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
