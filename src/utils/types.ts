import type { inferOutput } from "@trpc/tanstack-react-query";

import type { useTRPC } from "~/utils/trpc";

export type GameType = inferOutput<
  ReturnType<typeof useTRPC>["games"]["list"]
>[number];

export type ScoreType = inferOutput<
  ReturnType<typeof useTRPC>["scores"]["list"]
>[number];
