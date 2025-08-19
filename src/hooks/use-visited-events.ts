import { useCallback } from "react";

import { useLocalStorage } from "usehooks-ts";

export const useVisitedEvents = () => {
  const [events, setEvents] = useLocalStorage<
    {
      eventId: string;
      lastVisited: number;
    }[]
  >("visitedEvents", []);
  return {
    events,
    removeEvent: useCallback(
      (id: string) => {
        setEvents((prevEvents) =>
          (prevEvents ?? []).filter((event) => event.eventId !== id),
        );
      },
      [setEvents],
    ),
    upsertEvent: useCallback(
      (id: string) => {
        setEvents((prevEvents) => {
          const nextEvents = prevEvents ?? [];
          const event = {
            eventId: id,
            lastVisited: Date.now(),
          };
          const eventIndex = nextEvents.findIndex(
            (event) => event.eventId === id,
          );
          if (eventIndex !== -1) {
            return [
              ...nextEvents.slice(0, eventIndex),
              event,
              ...nextEvents.slice(eventIndex + 1),
            ];
          }
          return [...nextEvents, event];
        });
      },
      [setEvents],
    ),
  };
};
