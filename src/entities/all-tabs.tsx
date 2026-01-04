import type React from "react";

import { Tab, Tabs } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AddScoreForm } from "~/entities/add-score-form";
import { AdminTabs } from "~/entities/admin-tabs";
import { ScoreList } from "~/entities/score-list";
import { useModeratorStatus } from "~/hooks/use-moderator-status";
import type { EventId } from "~/server/schemas";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

export const AllTabs: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const trpc = useTRPC();
  const moderatorStatus = useModeratorStatus({ eventId });
  const { t } = useTranslation();
  const { data: event } = useSuspenseQuery(
    trpc.events.get.queryOptions({ id: eventId }),
  );
  if (!moderatorStatus) {
    return <ScoreList eventId={event.id} />;
  }
  return (
    <Tabs>
      <Tab key="scores" title={t("allTabs.scores")}>
        <ScoreList eventId={event.id} />
      </Tab>
      {!moderatorStatus ? null : (
        <Tab key="moderator" title={t("allTabs.moderation")}>
          <AddScoreForm eventId={event.id} />
        </Tab>
      )}
      {moderatorStatus !== "admin" ? null : (
        <Tab key="admin" title={t("allTabs.admin")}>
          <AdminTabs event={event} />
        </Tab>
      )}
    </Tabs>
  );
};
