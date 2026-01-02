import type React from "react";

import { Skeleton } from "@heroui/react";

import { Event } from "~/entities/event";
import { useMounted } from "~/hooks/use-mounted";
import { useVisitedEvents } from "~/hooks/use-visited-events";
import { useTranslation } from "~/utils/i18n";

export const Events: React.FC = () => {
  const { events } = useVisitedEvents();
  const isMounted = useMounted();
  const { t } = useTranslation();
  if (!isMounted) {
    return <Skeleton className="h-10 w-64 rounded-lg" />;
  }
  if (events.length === 0) {
    return <h3>{t("events.inviteMessage")}</h3>;
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
