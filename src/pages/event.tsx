import React from "react";

import { Button, Spinner } from "@heroui/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TRPCClientError } from "@trpc/client";
import { CiHome } from "react-icons/ci";

import { AllTabs } from "~/entities/all-tabs";
import { EventTitle } from "~/entities/event-title";
import { SettingsButton } from "~/entities/settings-button";
import { ErrorComponent, suspendedFallback } from "~/entities/suspense-wrapper";
import { useSubscription } from "~/hooks/use-subscription";
import { useVisitedEvents } from "~/hooks/use-visited-events";
import type { AppRouter } from "~/server/routers/_app";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

export const Page: React.FC<{ idOrAlias: string }> = suspendedFallback(
  ({ idOrAlias }) => {
    const trpc = useTRPC();
    const event = useSuspenseQuery(
      trpc.events.getByAlias.queryOptions({ idOrAlias }),
    );
    return <PageWithId event={event.data} />;
  },
  <Spinner size="lg" />,
  ({ error, idOrAlias, ...props }) => {
    const { t } = useTranslation();
    if (
      error instanceof TRPCClientError &&
      (error as TRPCClientError<AppRouter>).data?.code === "NOT_FOUND"
    ) {
      return (
        <div className="flex gap-4">
          <span>{t("event.notFound", { id: idOrAlias })}</span>
        </div>
      );
    }
    return <ErrorComponent error={error} {...props} />;
  },
);

const PageWithId: React.FC<{
  event: Awaited<ReturnType<AppRouter["events"]["getByAlias"]>>;
}> = ({ event }) => {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { upsertEvent } = useVisitedEvents();
  React.useEffect(() => {
    upsertEvent({ id: event.id, alias: event.alias });
  }, [event, upsertEvent]);
  useSubscription("game:added", ({ game }) => {
    queryClient.setQueryData(
      trpc.games.list.queryKey({ eventId: event.id }),
      (prevData) => {
        if (!prevData) {
          return;
        }
        return [...prevData, game];
      },
    );
  });
  useSubscription("game:removed", ({ id }) => {
    queryClient.setQueryData(
      trpc.games.list.queryKey({ eventId: event.id }),
      (prevData) => {
        if (!prevData) {
          return;
        }
        return prevData.filter((game) => game.id !== id);
      },
    );
  });
  useSubscription("game:updated", ({ id, updateObject }) => {
    queryClient.setQueryData(
      trpc.games.list.queryKey({ eventId: event.id }),
      (prevData) => {
        if (!prevData) {
          return;
        }
        const matchedGameIndex = prevData.findIndex((game) => game.id === id);
        if (matchedGameIndex === -1) {
          return prevData;
        }
        return [
          ...prevData.slice(0, matchedGameIndex),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { ...prevData[matchedGameIndex]!, title: updateObject.title },
          ...prevData.slice(matchedGameIndex + 1),
        ];
      },
    );
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              color="secondary"
              variant="bordered"
              isIconOnly
              as={Link}
              to="/"
            >
              <CiHome size={20} />
            </Button>
            <h1 className="text-[clamp(1rem,10vw,2rem)] leading-tight font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
              {t("common.title")}
            </h1>
          </div>
          <EventTitle eventId={event.id} />
        </div>
        <div className="flex items-center gap-3">
          <SettingsButton eventId={event.id} />
        </div>
      </div>
      <div>
        <AllTabs eventId={event.id} />
      </div>
    </div>
  );
};
