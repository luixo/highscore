import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { useModeratorKey } from "~/hooks/use-moderator-key";
import type { Moderatorrole } from "~/server/database/database.gen";
import type { EventId } from "~/server/schemas";
import { useTRPC } from "~/utils/trpc";

// undefined - not loaded yet, null - has no moderator status
type ModeratorStatus = Moderatorrole | null | undefined;

export const useModeratorStatus = ({
  eventId,
}: {
  eventId: EventId;
}): ModeratorStatus => {
  const trpc = useTRPC();
  const { moderatorKey } = useModeratorKey(eventId);
  const selfModeratorQuery = useQuery(
    trpc.moderator.get.queryOptions({ eventId }),
  );
  if (!moderatorKey) {
    return null;
  }
  if (selfModeratorQuery.status === "pending") {
    return;
  }
  if (selfModeratorQuery.status === "error") {
    return null;
  }
  return selfModeratorQuery.data.role;
};

export const useSuspenseModeratorStatus = ({
  eventId,
}: {
  eventId: EventId;
}): Moderatorrole => {
  const trpc = useTRPC();
  const selfModeratorQuery = useSuspenseQuery(
    trpc.moderator.get.queryOptions({ eventId }),
  );
  return selfModeratorQuery.data.role;
};
