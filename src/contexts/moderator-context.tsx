import type { Dispatch, FC, PropsWithChildren, SetStateAction } from "react";
import { createContext, useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { serialize } from "cookie";

import type { EventId, GameId } from "~/server/schemas";
import { useTRPC } from "~/utils/trpc";

export const MODERATOR_COOKIE_KEYS = "moderator-keys";

type StateReturn<S> = [S, Dispatch<SetStateAction<S>>];

type Keys = Record<EventId, GameId>;

export const ModeratorContext = createContext<StateReturn<Keys>>([
  {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {},
]);

export const ModeratorProvider: FC<
  PropsWithChildren<{ initialKeys: Keys }>
> = ({ initialKeys, children }) => {
  const [keys, setKeys] = useState(initialKeys);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const moderatorQueryFilter = trpc.moderator.get.queryFilter();
  useEffect(() => {
    if (Object.keys(keys).length === 0) {
      document.cookie = serialize(MODERATOR_COOKIE_KEYS, "", {
        maxAge: -1,
        sameSite: "strict",
      });
    } else {
      document.cookie = serialize(MODERATOR_COOKIE_KEYS, JSON.stringify(keys), {
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });
    }
    queryClient.invalidateQueries(moderatorQueryFilter);
  }, [keys, queryClient, moderatorQueryFilter]);
  return (
    <ModeratorContext value={[keys, setKeys]}>{children}</ModeratorContext>
  );
};
