import { Tab, Tabs } from '@nextui-org/react';
import type { FC } from 'react';
import { ModeratorTabs } from '~/components/moderator-tabs';
import { ScoreList } from '~/components/score-list';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import type { EventId } from '~/server/schemas';

export const AllTabs: FC<{ eventId: EventId }> = ({ eventId }) => {
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
          <ModeratorTabs eventId={eventId} />
        </Tab>
      )}
    </Tabs>
  );
};
