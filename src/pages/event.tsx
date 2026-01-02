import React from "react";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CiHome } from "react-icons/ci";

import { AllTabs } from "~/entities/all-tabs";
import { EventTitle } from "~/entities/event-title";
import { SettingsButton } from "~/entities/settings-button";
import { useSubscription } from "~/hooks/use-subscription";
import { useVisitedEvents } from "~/hooks/use-visited-events";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

export const Page: React.FC<{ id: string }> = ({ id: eventId }) => {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { upsertEvent } = useVisitedEvents();
  React.useEffect(() => {
    upsertEvent(eventId);
  }, [eventId, upsertEvent]);
  useSubscription("game:added", ({ game }) => {
    queryClient.setQueryData(
      trpc.games.list.queryKey({ eventId }),
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
      trpc.games.list.queryKey({ eventId }),
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
      trpc.games.list.queryKey({ eventId }),
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
          <EventTitle eventId={eventId} />
        </div>
        <div className="flex items-center gap-3">
          <SettingsButton eventId={eventId} />
        </div>
      </div>
      <div>
        <AllTabs eventId={eventId} />
      </div>
    </div>
  );
};
