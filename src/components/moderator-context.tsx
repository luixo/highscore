import { setCookie, deleteCookie } from 'cookies-next';
import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { createContext, useEffect, useState } from 'react';
import { MODERATOR_COOKIE_KEYS } from '~/server/cookie';
import type { EventId, GameId } from '~/server/schemas';
import { trpc } from '~/utils/trpc';

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
  const trpcUrils = trpc.useUtils();
  useEffect(() => {
    if (Object.keys(keys).length === 0) {
      deleteCookie(MODERATOR_COOKIE_KEYS);
    } else {
      setCookie(MODERATOR_COOKIE_KEYS, JSON.stringify(keys), {
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    trpcUrils.moderator.get.invalidate();
  }, [keys, trpcUrils]);
  return (
    <ModeratorContext value={[keys, setKeys]}>{children}</ModeratorContext>
  );
};
