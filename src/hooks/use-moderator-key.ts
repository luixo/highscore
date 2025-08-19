import { useCallback, useContext } from "react";

import { ModeratorContext } from "~/contexts/moderator-context";
import type { EventId } from "~/server/schemas";

export const useModeratorKey = (eventId: EventId) => {
  const [keys, setKeys] = useContext(ModeratorContext);
  return {
    moderatorKey: keys[eventId],
    setModeratorKey: useCallback(
      (id: string) => {
        setKeys((prevRecord) => ({ ...prevRecord, [eventId]: id }));
      },
      [eventId, setKeys],
    ),
    removeModeratorKey: useCallback(() => {
      setKeys((prevRecord) => {
        const nextRecord = { ...prevRecord };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete nextRecord[eventId];
        return nextRecord;
      });
    }, [eventId, setKeys]),
  };
};
