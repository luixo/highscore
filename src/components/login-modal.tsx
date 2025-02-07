import type { FC } from 'react';
import { useCallback, useRef, useState } from 'react';
import { CiLogin, CiCircleCheck, CiCircleRemove } from 'react-icons/ci';
import {
  Badge,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@nextui-org/react';
import { trpc } from '~/utils/trpc';
import type { EventId, GameId } from '~/server/schemas';
import { useModeratorStatus } from '~/hooks/use-moderator-status';
import { useModeratorKey } from '~/hooks/use-moderator-key';

const ModeratorStatusBadge: FC<{ eventId: GameId }> = ({ eventId }) => {
  const selfModeratorQuery = trpc.moderator.get.useQuery({ eventId });
  switch (selfModeratorQuery.status) {
    case 'error':
      return (
        <Button color="warning">
          <CiCircleRemove size={20} />
          {selfModeratorQuery.error.message}
        </Button>
      );
    case 'pending':
      return <Button isLoading>Загрузка...</Button>;
    case 'success':
      return (
        <Button color="success">
          <CiCircleCheck size={20} />
          Авторизация успешна
        </Button>
      );
  }
};

export const LoginModal: FC<{ eventId: EventId }> = ({ eventId }) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { moderatorKey, setModeratorKey, removeModeratorKey } =
    useModeratorKey(eventId);
  const [localModeratorKey, setLocalModeratorKey] = useState(
    moderatorKey || '',
  );
  const onSubmit = useCallback<React.FormEventHandler>(
    (e) => {
      e.preventDefault();
      setModeratorKey(localModeratorKey);
    },
    [localModeratorKey, setModeratorKey],
  );
  const moderatorStatus = useModeratorStatus({ eventId });
  return (
    <>
      <Badge
        color={
          moderatorStatus === 'Moderator'
            ? 'success'
            : moderatorStatus === 'Admin'
              ? 'warning'
              : 'primary'
        }
        content=" "
        isInvisible={!moderatorStatus}
      >
        <Button
          color="primary"
          variant="flat"
          isIconOnly
          onPress={() => setModalOpen(true)}
        >
          <CiLogin size={20} />
        </Button>
      </Badge>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <Form onSubmit={onSubmit}>
            <ModalHeader>Логин</ModalHeader>
            <ModalBody className="w-full">
              <ModeratorStatusBadge eventId={eventId} />
              <Input
                label="Ключ"
                type="email"
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
                  setLocalModeratorKey('');
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
