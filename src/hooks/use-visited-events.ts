import { useLocalStorageValue } from '@react-hookz/web';
import { useCallback } from 'react';

export const useVisitedEvents = () => {
  const { value, set: setEvents } = useLocalStorageValue<
    {
      eventId: string;
      lastVisited: number;
    }[]
  >('visitedEvents', {
    initializeWithValue: false,
  });
  const events = value ?? [];
  return {
    events,
    removeEvent: useCallback(
      (id: string) => {
        setEvents((prevEvents = []) => {
          prevEvents = prevEvents ?? [];
          return prevEvents.filter((event) => event.eventId === id);
        });
      },
      [setEvents],
    ),
    upsertEvent: useCallback(
      (id: string) => {
        setEvents((prevEvents) => {
          prevEvents = prevEvents ?? [];
          const event = {
            eventId: id,
            lastVisited: Date.now(),
          };
          const eventIndex = prevEvents.findIndex(
            (event) => event.eventId === id,
          );
          if (eventIndex !== -1) {
            return [
              ...prevEvents.slice(0, eventIndex),
              event,
              ...prevEvents.slice(eventIndex + 1),
            ];
          }
          return [...prevEvents, event];
        });
      },
      [setEvents],
    ),
  };
};
