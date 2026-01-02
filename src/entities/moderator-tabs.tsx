import type React from "react";

import { Tab, Tabs } from "@heroui/react";

import { AddGameForm } from "~/entities/add-game-form";
import { AddModeratorForm } from "~/entities/add-moderator-form";
import { ModeratorsList } from "~/entities/moderators-list";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useSuspenseModeratorStatus } from "~/hooks/use-moderator-status";
import type { EventId } from "~/server/schemas";
import { useTranslation } from "~/utils/i18n";

export const ModeratorTabs: React.FC<
  React.PropsWithChildren<{ eventId: EventId }>
> = suspendedFallback(({ eventId, children }) => {
  const moderatorStatus = useSuspenseModeratorStatus({ eventId });
  const { t } = useTranslation();
  if (moderatorStatus === "admin") {
    return (
      <Tabs>
        <Tab key="add-score" title={t("moderatorTabs.record")}>
          {children}
        </Tab>
        <Tab key="add-game" title={t("moderatorTabs.game")}>
          <AddGameForm eventId={eventId} />
        </Tab>
        <Tab
          key="add-moderator"
          title={t("moderatorTabs.moderator")}
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
