import React from "react";

import {
  Alert,
  Badge,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
} from "@heroui/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { CiLogin } from "react-icons/ci";

import { ErrorComponent, suspendedFallback } from "~/entities/suspense-wrapper";
import { useModeratorKey } from "~/hooks/use-moderator-key";
import { useSuspenseModeratorStatus } from "~/hooks/use-moderator-status";
import type { AppRouter } from "~/server/routers/_app";
import type { EventId, GameId } from "~/server/schemas";
import { useTRPC } from "~/utils/trpc";

const ModeratorStatusAlert = suspendedFallback<{ eventId: GameId }>(
  ({ eventId }) => {
    const trpc = useTRPC();
    useSuspenseQuery(trpc.moderator.get.queryOptions({ eventId }));
    return <Alert color="success">Авторизация успешна</Alert>;
  },
  <Skeleton className="h-16 w-full rounded-md" />,
  ({ error, eventId, ...props }) => {
    const { moderatorKey } = useModeratorKey(eventId);
    if (
      error instanceof TRPCClientError &&
      (error as TRPCClientError<AppRouter>).data?.code === "UNAUTHORIZED"
    ) {
      return (
        <Alert color="danger">{`Ключ "${moderatorKey}" не найден!`}</Alert>
      );
    }
    return <ErrorComponent error={error} {...props} />;
  },
);

const ModeratorBadgeWrapper = suspendedFallback<
  React.PropsWithChildren<{ eventId: string }>
>(
  ({ children, eventId }) => {
    const moderatorStatus = useSuspenseModeratorStatus({ eventId });
    return (
      <Badge
        color={moderatorStatus === "admin" ? "warning" : "success"}
        content=" "
        isInvisible={!moderatorStatus}
      >
        {children}
      </Badge>
    );
  },
  ({ children }) => <>{children}</>,
  ({ children }) => <>{children}</>,
);

export const LoginModal: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const trpc = useTRPC();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
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
    <>
      <ModeratorBadgeWrapper eventId={eventId}>
        <Button
          color="primary"
          variant="flat"
          isIconOnly
          onPress={() => setModalOpen(true)}
        >
          <CiLogin size={20} />
        </Button>
      </ModeratorBadgeWrapper>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <Form onSubmit={onSubmit}>
            <ModalHeader>Логин</ModalHeader>
            <ModalBody className="w-full">
              <ModeratorStatusAlert key={moderatorKey} eventId={eventId} />
              <Input
                label="Ключ"
                value={localModeratorKey}
                onValueChange={setLocalModeratorKey}
                ref={emailRef}
              />
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                color="primary"
                isDisabled={localModeratorKey.length === 0}
                type="submit"
              >
                Сохранить
              </Button>
              <Button
                color="danger"
                isDisabled={!moderatorKey}
                onPress={() => {
                  removeModeratorKey();
                  setLocalModeratorKey("");
                }}
              >
                Выйти
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};
