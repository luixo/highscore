import React from "react";

import { Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useVisitedEvents } from "~/hooks/use-visited-events";
import { useTRPC } from "~/utils/trpc";

export const EventTitle = suspendedFallback<{ eventId: string }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    const router = useRouter();
    const { removeEvent } = useVisitedEvents();
    const eventQuery = useSuspenseQuery(
      trpc.events.get.queryOptions({ id: eventId }),
    );
    React.useEffect(() => {
      if (
        eventQuery.status === "error" &&
        eventQuery.error.data?.code === "NOT_FOUND"
      ) {
        removeEvent(eventId);
        router.navigate({ to: "/" });
      }
    }, [eventId, eventQuery.error, eventQuery.status, removeEvent, router]);
    return <span>{eventQuery.data.title}</span>;
  },
  <Skeleton className="h-6 w-24 rounded-md" />,
);
