import { Tab, Tabs } from '@nextui-org/react';
import { AddGameForm } from '~/components/add-game-form';
import { AddModeratorForm } from '~/components/add-moderator-form';
import { AddScoreForm } from '~/components/add-score-form';
import { useModeratorStatus } from '~/hooks/use-moderator-status';

export const ModeratorTabs = () => {
  const moderatorStatus = useModeratorStatus();
  if (!moderatorStatus) {
    return null;
  }
  if (moderatorStatus === 'Admin') {
    return (
      <Tabs>
        <Tab key="add-score" title="Рекорд">
          <AddScoreForm />
        </Tab>
        <Tab key="add-game" title="Игра">
          <AddGameForm />
        </Tab>
        <Tab key="add-moderator" title="Модератор">
          <AddModeratorForm />
        </Tab>
      </Tabs>
    );
  }
  return <AddScoreForm />;
};
