import type React from "react";

import { Skeleton } from "@heroui/react";

import { Event } from "~/entities/event";
import { useMounted } from "~/hooks/use-mounted";
import { useVisitedEvents } from "~/hooks/use-visited-events";

export const Events: React.FC = () => {
  const { events } = useVisitedEvents();
  const isMounted = useMounted();
  if (!isMounted) {
    return <Skeleton className="h-10 w-64 rounded-lg" />;
  }
  if (events.length === 0) {
    return <h3>Попроси пригласить тебя в игру!</h3>;
  }
  return (
    <div className="flex flex-col gap-4">
      {events
        .toSorted((eventA, eventB) => eventB.lastVisited - eventA.lastVisited)
        .map((event) => (
          <Event key={event.eventId} id={event.eventId} />
        ))}
    </div>
  );
};
