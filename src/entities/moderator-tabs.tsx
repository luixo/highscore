import type React from "react";

import { Tab, Tabs } from "@heroui/react";

import { AddGameForm } from "~/entities/add-game-form";
import { AddModeratorForm } from "~/entities/add-moderator-form";
import { AddScoreForm } from "~/entities/add-score-form";
import { ModeratorsList } from "~/entities/moderators-list";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useSuspenseModeratorStatus } from "~/hooks/use-moderator-status";
import type { EventId } from "~/server/schemas";

export const ModeratorTabs: React.FC<
  React.PropsWithChildren<{ eventId: EventId }>
> = suspendedFallback(({ eventId, children }) => {
  const moderatorStatus = useSuspenseModeratorStatus({ eventId });
  if (moderatorStatus === "admin") {
    return (
      <Tabs>
        <Tab key="add-score" title="Рекорд">
          {children}
          <AddScoreForm eventId={eventId} />
        </Tab>
        <Tab key="add-game" title="Игра">
          <AddGameForm eventId={eventId} />
        </Tab>
        <Tab
          key="add-moderator"
          title="Модератор"
          className="flex flex-col gap-10"
        >
          <AddModeratorForm eventId={eventId} />
          <ModeratorsList eventId={eventId} />
        </Tab>
      </Tabs>
    );
  }
  return <>{children}</>;
}, null);
