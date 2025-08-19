import { useCallback } from "react";

import { useLocalStorage } from "usehooks-ts";

import type { EventId, GameId } from "~/server/schemas";

export const useLastGame = (eventId: EventId) => {
  const [gamesRecord, setGamesRecord] = useLocalStorage<
    Record<EventId, GameId>
  >("selectedGameIds", {});
  return {
    gameId: gamesRecord[eventId],
    setGameId: useCallback(
      (id: string) => {
        setGamesRecord((prevRecord) => ({ ...prevRecord, [eventId]: id }));
      },
      [eventId, setGamesRecord],
    ),
    removeGameId: useCallback(() => {
      setGamesRecord((prevRecord) => {
        const nextRecord = { ...prevRecord };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete nextRecord[eventId];
        return nextRecord;
      });
    }, [eventId, setGamesRecord]),
  };
};
