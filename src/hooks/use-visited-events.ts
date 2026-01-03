import React, { useCallback } from "react";

import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

import { eventAliasSchema, eventIdSchema } from "~/server/schemas";

const visitedEventSchema = z.object({
  event: z.object({
    id: eventIdSchema,
    alias: eventAliasSchema.optional(),
  }),
  lastVisited: z.number(),
});

export const useVisitedEvents = () => {
  const [events, setEvents] = useLocalStorage<
    z.infer<typeof visitedEventSchema>[]
  >("visitedEvents", []);
  const parsedEvents = visitedEventSchema.array().safeParse(events);
  React.useEffect(() => {
    if (!parsedEvents.success) {
      setEvents([]);
    }
  }, [parsedEvents, setEvents]);
  return {
    events: parsedEvents.data ?? [],
    removeEvent: useCallback(
      (id: string) => {
        setEvents((prevEvents) =>
          (prevEvents ?? []).filter(({ event }) => event.id !== id),
        );
      },
      [setEvents],
    ),
    upsertEvent: useCallback(
      (event: { id: string; alias?: string }) => {
        setEvents((prevEvents) => {
          const nextEntity = {
            event,
            lastVisited: Date.now(),
          };
          const eventIndex = prevEvents.findIndex(
            ({ event }) => event.id === nextEntity.event.id,
          );
          if (eventIndex !== -1) {
            return [
              ...prevEvents.slice(0, eventIndex),
              nextEntity,
              ...prevEvents.slice(eventIndex + 1),
            ];
          }
          return [...prevEvents, nextEntity];
        });
      },
      [setEvents],
    ),
  };
};
