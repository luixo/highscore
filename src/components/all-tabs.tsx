import { Tab, Tabs } from '@nextui-org/react';
import { ModeratorTabs } from '~/components/moderator-tabs';
import { ScoreList } from '~/components/score-list';
import { useModeratorStatus } from '~/hooks/use-moderator-status';

export const AllTabs = () => {
  const moderatorStatus = useModeratorStatus();
  if (!moderatorStatus) {
    return <ScoreList />;
  }
  return (
    <Tabs>
      <Tab key="scores" title="Результаты">
        <ScoreList />
      </Tab>
      {!moderatorStatus ? null : (
        <Tab key="moderator" title="Модерация">
          <ModeratorTabs />
        </Tab>
      )}
    </Tabs>
  );
};
