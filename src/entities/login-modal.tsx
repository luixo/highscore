import React from "react";

import { Button, Form, Input } from "@heroui/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import {
  FaCheck,
  FaExclamation,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import { twMerge } from "tailwind-merge";

import { ErrorComponent, suspendedFallback } from "~/entities/suspense-wrapper";
import { useModeratorKey } from "~/hooks/use-moderator-key";
import type { AppRouter } from "~/server/routers/_app";
import type { EventId, GameId } from "~/server/schemas";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

type ModeratorState = "loading" | "error" | "success";
const moderatorStates = {
  loading: {
    outerClassName: "bg-neutral-50 dark:bg-neutral-100 border-neutral-100",
    innerClassName: "text-neutral-700 dark:text-neutral",
    Component: FaSpinner,
  },
  error: {
    outerClassName: "bg-danger-50 dark:bg-danger-100 border-danger-100",
    innerClassName: "text-danger-700 dark:text-danger",
    Component: FaExclamation,
  },
  success: {
    outerClassName: "bg-success-50 dark:bg-success-100 border-success-100",
    innerClassName: "text-success-700 dark:text-success",
    Component: FaCheck,
  },
} satisfies Record<
  ModeratorState,
  { outerClassName: string; innerClassName: string; Component: typeof FaCheck }
>;

const ModeratorStatusButton: React.FC<{ state: ModeratorState }> = ({
  state,
}) => {
  const Component = moderatorStates[state].Component;
  return (
    <div
      className={twMerge(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        moderatorStates[state].outerClassName,
      )}
    >
      <Component
        className={twMerge("size-3", moderatorStates[state].innerClassName)}
      />
    </div>
  );
};

const ModeratorStatus = suspendedFallback<{ eventId: GameId }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    useSuspenseQuery(trpc.moderator.get.queryOptions({ eventId }));
    return <ModeratorStatusButton state="success" />;
  },
  <ModeratorStatusButton state="loading" />,
  ({ error, ...props }) => {
    if (
      error instanceof TRPCClientError &&
      (error as TRPCClientError<AppRouter>).data?.code === "UNAUTHORIZED"
    ) {
      return <ModeratorStatusButton state="error" />;
    }
    return <ErrorComponent error={error} {...props} />;
  },
);

export const LoginModal: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const [isPasswordVisible, setPasswordVisible] = React.useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { moderatorKey, setModeratorKey, removeModeratorKey } =
    useModeratorKey(eventId);
  const [localModeratorKey, setLocalModeratorKey] = React.useState(
    moderatorKey || "",
  );
  const moderatorQueryFilter = trpc.moderator.get.queryFilter({ eventId });
  const onSubmit = React.useCallback<React.FormEventHandler>(
    (e) => {
      e.preventDefault();
      setModeratorKey(localModeratorKey);
      queryClient.invalidateQueries(moderatorQueryFilter);
    },
    [localModeratorKey, queryClient, moderatorQueryFilter, setModeratorKey],
  );
  return (
    <Form onSubmit={onSubmit}>
      <h4>{t("login.title")}</h4>
      <Input
        label={t("login.form.key.label")}
        value={localModeratorKey}
        onValueChange={setLocalModeratorKey}
        ref={emailRef}
        type={isPasswordVisible ? "text" : "password"}
        startContent={<ModeratorStatus key={moderatorKey} eventId={eventId} />}
        endContent={
          <button
            className="outline-transparent focus:outline-solid"
            type="button"
            onClick={() => setPasswordVisible((state) => !state)}
          >
            {isPasswordVisible ? (
              <FaEyeSlash className="text-default-400 pointer-events-none size-5" />
            ) : (
              <FaEye className="text-default-400 pointer-events-none size-5" />
            )}
          </button>
        }
      />
      <div className="flex gap-2">
        <Button
          color="primary"
          isDisabled={localModeratorKey.length === 0}
          type="submit"
        >
          {t("login.form.button")}
        </Button>
        <Button
          color="danger"
          isDisabled={!moderatorKey}
          onPress={() => {
            removeModeratorKey();
            setLocalModeratorKey("");
          }}
        >
          {t("login.form.logoutButton")}
        </Button>
      </div>
    </Form>
  );
};
