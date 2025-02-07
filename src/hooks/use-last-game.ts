import { useLocalStorageValue } from '@react-hookz/web';
import { useCallback } from 'react';
import type { EventId } from '~/server/schemas';
import type { GameId } from '~/server/schemas';

export const useLastGame = (eventId: EventId) => {
  const { value, set: setGamesRecord } = useLocalStorageValue<
    Record<EventId, GameId>
  >('selectedGameIds', { initializeWithValue: false });
  const gamesRecord = value ?? {};
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
        delete nextRecord[eventId];
        return nextRecord;
      });
    }, [eventId, setGamesRecord]),
  };
};
