import { Button, Link, Skeleton } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { CiPlay1 } from "react-icons/ci";

import { RemoveButton } from "~/components/remove-button";
import { ErrorComponent, suspendedFallback } from "~/entities/suspense-wrapper";
import { useVisitedEvents } from "~/hooks/use-visited-events";
import type { AppRouter } from "~/server/routers/_app";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

export const Event = suspendedFallback<{ id: string; alias?: string }>(
  ({ id }) => {
    const trpc = useTRPC();
    const { t } = useTranslation();
    const { data: event } = useSuspenseQuery(
      trpc.events.get.queryOptions({ id }),
    );
    return (
      <Link href={`/events/${id}`} className="inline-flex gap-2">
        <span className="text-lg">
          {t("event.game", { title: event.title })}
        </span>
        <Button isIconOnly color="primary">
          <CiPlay1 size="24" />
        </Button>
      </Link>
    );
  },
  <Skeleton className="h-10 w-64 rounded-lg" />,
  ({ error, id, ...props }) => {
    const { t } = useTranslation();
    const { removeEvent } = useVisitedEvents();
    if (
      error instanceof TRPCClientError &&
      (error as TRPCClientError<AppRouter>).data?.code === "NOT_FOUND"
    ) {
      return (
        <div className="flex gap-4">
          <span>{t("event.notFound", { id })}</span>
          <RemoveButton onClick={() => removeEvent(id)} />
        </div>
      );
    }
    return <ErrorComponent error={error} {...props} />;
  },
);
