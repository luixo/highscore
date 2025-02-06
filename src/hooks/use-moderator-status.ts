import type { ModeratorRole } from '@prisma/client';
import { useContext } from 'react';
import { ModeratorContext } from '~/components/moderator-context';
import type { EventId } from '~/server/schemas';
import { trpc } from '~/utils/trpc';

// undefined - not loaded yet, null - has no moderator status
type ModeratorStatus = ModeratorRole | null | undefined;

export const useModeratorStatus = ({
  eventId,
}: {
  eventId: EventId;
}): ModeratorStatus => {
  const [moderator] = useContext(ModeratorContext);
  const selfModeratorQuery = trpc.moderator.get.useQuery({ eventId });
  if (!moderator) {
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
