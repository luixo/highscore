import { trpc } from '~/utils/trpc';
import { LoginModal } from '~/components/login-modal';
import { usePusher } from '~/hooks/use-pusher';
import { AllTabs } from '~/components/all-tabs';
import { CiRedo } from 'react-icons/ci';
import { useCallback } from 'react';
import { Button } from '@nextui-org/react';
import type { NextPageWithLayout } from '~/pages/_app';
import { useRouter } from 'next/router';

const EventPage: NextPageWithLayout = () => {
  const router = useRouter();
  const eventId = router.query.id as string;
  const trpcUtils = trpc.useUtils();
  usePusher('game:added', ({ game }) => {
    trpcUtils.games.list.setData({ eventId }, (prevData) => {
      if (!prevData) {
        return;
      }
      return [...prevData, game];
    });
  });
  usePusher('game:removed', ({ id }) => {
    trpcUtils.games.list.setData({ eventId }, (prevData) => {
      if (!prevData) {
        return;
      }
      return prevData.filter((game) => game.id !== id);
    });
  });
  usePusher('game:updated', ({ id, updateObject }) => {
    trpcUtils.games.list.setData({ eventId }, (prevData) => {
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
          Список рекордов
        </h1>
        <div className="flex gap-2">
          <Button color="warning" variant="bordered" isIconOnly>
            <CiRedo onClick={invalidateQueries} size={20} />
          </Button>
          <LoginModal eventId={eventId} />
        </div>
      </div>
      <div>
        <AllTabs eventId={eventId} />
      </div>
    </div>
  );
};

export default EventPage;
