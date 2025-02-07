import type { ModeratorRole } from '@prisma/client';
import { useModeratorKey } from '~/hooks/use-moderator-key';
import type { EventId } from '~/server/schemas';
import { trpc } from '~/utils/trpc';

// undefined - not loaded yet, null - has no moderator status
type ModeratorStatus = ModeratorRole | null | undefined;

export const useModeratorStatus = ({
  eventId,
}: {
  eventId: EventId;
}): ModeratorStatus => {
  const { moderatorKey } = useModeratorKey(eventId);
  const selfModeratorQuery = trpc.moderator.get.useQuery({ eventId });
  if (!moderatorKey) {
    return null;
  }
  if (selfModeratorQuery.status === 'pending') {
    return;
  }
  if (selfModeratorQuery.status === 'error') {
    return null;
  }
  return selfModeratorQuery.data.role;
};
