import React from "react";

import { Card, CardBody, CardHeader, Divider, addToast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

import { RemoveButton } from "~/components/remove-button";
import { Scores } from "~/entities/scores";
import { suspendedFallback } from "~/entities/suspense-wrapper";
import { useSuspenseModeratorStatus } from "~/hooks/use-moderator-status";
import { useTRPC } from "~/utils/trpc";
import type { GameType } from "~/utils/types";

const RemoveGameButton = suspendedFallback<{ eventId: string; gameId: string }>(
  ({ eventId, gameId }) => {
    const trpc = useTRPC();
    const removeGameMutation = useMutation(
      trpc.games.remove.mutationOptions({
        onSuccess: (_result, variables) => {
          addToast({
            title: "Успех",
            description: `Игра "${variables.id}" удалена.`,
            color: "success",
          });
        },
      }),
    );
    const moderatorStatus = useSuspenseModeratorStatus({ eventId });
    if (moderatorStatus !== "admin") {
      return null;
    }
    return (
      <RemoveButton
        onClick={() => removeGameMutation.mutate({ eventId, id: gameId })}
      />
    );
  },
  null,
  () => null,
);

export const Game: React.FC<{
  game: GameType;
}> = ({ game }) => {
  const [imageStatus, setImageStatus] = React.useState("idle");
  return (
    <Card className="min-h-[250px] w-[320px] lg:w-[240px]">
      <CardHeader className="bg-secondary/50 text-foreground relative flex aspect-[32/5] w-full justify-between gap-2 overflow-hidden">
        {game.logoUrl ? (
          <img
            className={`absolute inset-0 -z-20 size-full object-cover ${imageStatus === "error" ? "hidden" : ""}`}
            src={game.logoUrl}
            alt={game.title}
            onError={() => setImageStatus("error")}
            onLoad={() => setImageStatus("success")}
          />
        ) : null}
        {imageStatus === "success" ? null : <h3>{game.title}</h3>}
        <RemoveGameButton eventId={game.eventId} gameId={game.id} />
      </CardHeader>
      <Divider />
      <CardBody className="max-h-[220px] px-2">
        <Scores game={game} />
      </CardBody>
    </Card>
  );
};
