import { Button, Link, Spinner } from '@nextui-org/react';
import { useFirstMountState } from '@react-hookz/web';
import { useVisitedEvents } from '~/hooks/use-visited-events';
import type { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import { CiPlay1 } from 'react-icons/ci';
import React, { useEffect } from 'react';
import { CreateEventModal } from '~/components/create-event-modal';

const IndexPage: NextPageWithLayout = () => {
  const { events, removeEvent } = useVisitedEvents();
  const firstMount = useFirstMountState();
  const eventsQueries = trpc.useQueries((t) =>
    events.map((event) => t.events.get({ id: event.eventId })),
  );
  useEffect(() => {
    const erroredQueriesIndices = eventsQueries
      .map((query, index) => [query, index] as const)
      .filter(([query]) => query.error?.data?.code === 'NOT_FOUND')
      .map(([, index]) => index);
    if (erroredQueriesIndices.length === 0) {
      return;
    }
    erroredQueriesIndices.forEach((index) => {
      removeEvent(events[index].eventId);
    });
  }, [events, eventsQueries, removeEvent]);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
          Список игр
        </h1>
        <CreateEventModal />
      </div>
      {firstMount ? (
        <Spinner />
      ) : events.length === 0 ? (
        <h3>Попроси пригласить тебя в игру!</h3>
      ) : (
        <div>
          {eventsQueries.map((eventQuery, index) => {
            const key = events[index].eventId;
            switch (eventQuery.status) {
              case 'pending':
                return <Spinner key={key} size="sm" />;
              case 'error':
                return (
                  <Button key={key} color="warning">
                    {eventQuery.error.message}
                  </Button>
                );
              case 'success':
                return (
                  <div key={key}>
                    <Link
                      key={key}
                      href={`/events/${eventQuery.data.id}`}
                      className="inline-flex gap-2 text-lg"
                    >
                      Игра "{eventQuery.data.title}"
                      <Button isIconOnly color="primary">
                        <CiPlay1 size="24" />
                      </Button>
                    </Link>
                  </div>
                );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default IndexPage;
