import { trpc } from '~/utils/trpc';
import type { NextPageWithLayout } from './_app';
import { LoginModal } from '~/components/login-modal';
import { usePusher } from '~/hooks/use-pusher';
import { AllTabs } from '~/components/all-tabs';
import { CiRedo } from 'react-icons/ci';
import { useCallback } from 'react';
import { Button } from '@nextui-org/react';

const IndexPage: NextPageWithLayout = () => {
  const trpcUtils = trpc.useUtils();
  usePusher('game:added', ({ game }) => {
    trpcUtils.games.list.setData(undefined, (prevData) => {
      if (!prevData) {
        return;
      }
      return [...prevData, game];
    });
  });
  usePusher('game:removed', ({ id }) => {
    trpcUtils.games.list.setData(undefined, (prevData) => {
      if (!prevData) {
        return;
      }
      return prevData.filter((game) => game.id !== id);
    });
  });
  usePusher('game:updated', ({ id, updateObject }) => {
    trpcUtils.games.list.setData(undefined, (prevData) => {
      if (!prevData) {
        return;
      }
      const matchedGameIndex = prevData.findIndex((game) => game.id === id);
      if (matchedGameIndex === -1) {
        return prevData;
      }
      return [
        ...prevData.slice(0, matchedGameIndex),
        { ...prevData[matchedGameIndex], title: updateObject.title },
        ...prevData.slice(matchedGameIndex + 1),
      ];
    });
  });

  const invalidateQueries = useCallback(() => {
    trpcUtils.invalidate();
  }, [trpcUtils]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
          Список рекордов
        </h1>
        <div className="flex gap-2">
          <Button color="warning" variant="bordered" isIconOnly>
            <CiRedo onClick={invalidateQueries} size={20} />
          </Button>
          <LoginModal />
        </div>
      </div>
      <div>
        <AllTabs />
      </div>
    </div>
  );
};

export default IndexPage;
