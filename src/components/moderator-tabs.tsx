import { Tab, Tabs } from '@nextui-org/react';
import type { FC } from 'react';
import { AddGameForm } from '~/components/add-game-form';
import { AddModeratorForm } from '~/components/add-moderator-form';
import { AddScoreForm } from '~/components/add-score-form';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import type { EventId } from '~/server/schemas';

export const ModeratorTabs: FC<{ eventId: EventId }> = ({ eventId }) => {
  const moderatorStatus = useModeratorStatus({ eventId });
  if (!moderatorStatus) {
    return null;
  }
  if (moderatorStatus === 'Admin') {
    return (
      <Tabs>
        <Tab key="add-score" title="Рекорд">
          <AddScoreForm eventId={eventId} />
        </Tab>
        <Tab key="add-game" title="Игра">
          <AddGameForm eventId={eventId} />
        </Tab>
        <Tab key="add-moderator" title="Модератор">
          <AddModeratorForm eventId={eventId} />
        </Tab>
      </Tabs>
    );
  }
  return <AddScoreForm eventId={eventId} />;
};
