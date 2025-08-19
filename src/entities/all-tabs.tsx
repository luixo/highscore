import type React from "react";

import { Tab, Tabs } from "@heroui/react";

import { AddScoreForm } from "~/entities/add-score-form";
import { ModeratorTabs } from "~/entities/moderator-tabs";
import { ScoreList } from "~/entities/score-list";
import { useModeratorStatus } from "~/hooks/use-moderator-status";
import type { EventId } from "~/server/schemas";

export const AllTabs: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const moderatorStatus = useModeratorStatus({ eventId });
  if (!moderatorStatus) {
    return <ScoreList eventId={eventId} />;
  }
  return (
    <Tabs>
      <Tab key="scores" title="Результаты">
        <ScoreList eventId={eventId} />
      </Tab>
      {!moderatorStatus ? null : (
        <Tab key="moderator" title="Модерация">
          <ModeratorTabs eventId={eventId}>
            <AddScoreForm eventId={eventId} />
          </ModeratorTabs>
        </Tab>
      )}
    </Tabs>
  );
};
