import { trpc } from '~/utils/trpc';
import { LoginModal } from '~/components/login-modal';
import { usePusher } from '~/hooks/use-pusher';
import { AllTabs } from '~/components/all-tabs';
import { CiHome, CiRedo } from 'react-icons/ci';
import { useCallback, useEffect } from 'react';
import { Button, Spinner } from '@nextui-org/react';
import type { NextPageWithLayout } from '~/pages/_app';
import { useRouter } from 'next/router';
import { useVisitedEvents } from '~/hooks/use-visited-events';

const EventPage: NextPageWithLayout = () => {
  const router = useRouter();
  const eventId = router.query.id as string;
  const trpcUtils = trpc.useUtils();
  const { upsertEvent, removeEvent } = useVisitedEvents();
  useEffect(() => {
    upsertEvent(eventId);
  }, [eventId, upsertEvent]);
  const eventQuery = trpc.events.get.useQuery({ id: eventId });
  useEffect(() => {
    if (
      eventQuery.status === 'error' &&
      eventQuery.error.data?.code === 'NOT_FOUND'
    ) {
      removeEvent(eventId);
      router.push('/events');
    }
  }, [eventId, eventQuery.error, eventQuery.status, removeEvent, router]);
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
  const navigateHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Button color="secondary" variant="bordered" isIconOnly>
              <CiHome onClick={navigateHome} size={20} />
            </Button>
            <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold leading-tight tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
              Список рекордов
            </h1>
          </div>
          {eventQuery.status === 'pending' ? (
            <Spinner size="sm" />
          ) : eventQuery.status === 'success' ? (
            <span>{eventQuery.data.title}</span>
          ) : null}
        </div>
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
