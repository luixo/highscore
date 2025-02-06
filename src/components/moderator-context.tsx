import { setCookie, deleteCookie } from 'cookies-next';
import type {
  Dispatch,
  FC,
  PropsWithChildren,
  SetStateAction} from 'react';
import {
  createContext,
  useEffect,
  useState,
} from 'react';
import { MODERATOR_COOKIE_NAME } from '~/server/cookie';
import { trpc } from '~/utils/trpc';

type StateReturn<S> = [S, Dispatch<SetStateAction<S>>];

export const ModeratorContext = createContext<StateReturn<string | undefined>>([
  undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {},
]);

export const ModeratorProvider: FC<
  PropsWithChildren<{ initialEmail: string | undefined }>
> = ({ initialEmail, children }) => {
  const [moderator, setModerator] = useState(initialEmail);
  const trpcUrils = trpc.useUtils();
  useEffect(() => {
    if (moderator) {
      setCookie(MODERATOR_COOKIE_NAME, moderator, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    } else {
      deleteCookie(MODERATOR_COOKIE_NAME);
    }
    trpcUrils.moderator.get.invalidate();
  }, [moderator, trpcUrils]);
  return (
    <ModeratorContext value={[moderator, setModerator]}>
      {children}
    </ModeratorContext>
  );
};
