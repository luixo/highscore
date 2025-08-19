import React from "react";

import { Card, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CiRead, CiUnread } from "react-icons/ci";

import { Input } from "~/components/input";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import type { EventId } from "~/server/schemas";
import { useTRPC } from "~/utils/trpc";

const ModeratorKey: React.FC<{ moderatorKey: string }> = ({ moderatorKey }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  return (
    <Input
      value={moderatorKey}
      type={isVisible ? "text" : "password"}
      readOnly
      label="Ключ"
      endContent={
        isVisible ? (
          <CiUnread
            className="size-5 cursor-pointer"
            onClick={toggleVisibility}
          />
        ) : (
          <CiRead
            className="size-5 cursor-pointer"
            onClick={toggleVisibility}
          />
        )
      }
    />
  );
};

export const ModeratorsList = suspendedFallback<{ eventId: EventId }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    const { data: moderators } = useSuspenseQuery(
      trpc.moderator.list.queryOptions({ eventId }),
    );
    return (
      <div className="flex flex-col gap-3">
        {moderators.map((moderator) => (
          <Card key={moderator.key} className="flex flex-row gap-2 p-4">
            <Input label="Имя" readOnly value={moderator.name} />
            <ModeratorKey moderatorKey={moderator.key} />
          </Card>
        ))}
      </div>
    );
  },
  <Skeleton className="h-22 w-full rounded-md" />,
);
