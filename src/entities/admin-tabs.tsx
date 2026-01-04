import type React from "react";

import { Tab, Tabs } from "@heroui/react";

import { AddGameForm } from "~/entities/add-game-form";
import { AddModeratorForm } from "~/entities/add-moderator-form";
import { ChangeEvent } from "~/entities/change-event";
import { ModeratorsList } from "~/entities/moderators-list";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useTranslation } from "~/utils/i18n";
import type { RouterOutput } from "~/utils/query";

export const AdminTabs: React.FC<{ event: RouterOutput["events"]["get"] }> =
  suspendedFallback(({ event }) => {
    const { t } = useTranslation();
    return (
      <Tabs>
        <Tab key="add-game" title={t("adminTabs.addGame")}>
          <AddGameForm eventId={event.id} />
        </Tab>
        <Tab
          key="add-moderator"
          title={t("adminTabs.addModerator")}
          className="flex flex-col gap-10"
        >
          <AddModeratorForm eventId={event.id} />
          <ModeratorsList eventId={event.id} />
        </Tab>
        <Tab
          key="modify-game"
          title={t("adminTabs.modifyEvent")}
          className="flex flex-col gap-10"
        >
          <ChangeEvent event={event} />
        </Tab>
      </Tabs>
    );
  }, null);
