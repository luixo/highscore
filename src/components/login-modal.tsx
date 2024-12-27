import { FC, useCallback, useContext, useRef, useState } from 'react';
import { CiLogin, CiCircleCheck, CiCircleRemove } from 'react-icons/ci';
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@nextui-org/react';
import { ModeratorContext } from '~/components/moderator-context';
import { trpc } from '~/utils/trpc';

const ModeratorStatusBadge: FC = () => {
  const selfModeratorQuery = trpc.moderator.get.useQuery();
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

export const LoginModal: FC = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [moderator, setModerator] = useContext(ModeratorContext);
  const [localModerator, setLocalModerator] = useState(moderator || '');
  const onSubmit = useCallback<React.FormEventHandler>(
    (e) => {
      e.preventDefault();
      setModerator(localModerator);
    },
    [localModerator, setModerator],
  );
  return (
    <>
      <Button
        color="primary"
        variant="flat"
        isIconOnly
        onPress={() => setModalOpen(true)}
      >
        <CiLogin size={20} />
      </Button>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <Form onSubmit={onSubmit}>
            <ModalHeader>Логин</ModalHeader>
            <ModalBody className="w-full">
              <ModeratorStatusBadge />
              <Input
                label="Ключ"
                type="email"
                value={localModerator}
                onValueChange={setLocalModerator}
                ref={emailRef}
              />
            </ModalBody>
            <ModalFooter className="w-full">
              <Button
                color="primary"
                isDisabled={localModerator.length === 0}
                type="submit"
              >
                Сохранить
              </Button>
              <Button
                color="danger"
                isDisabled={!moderator}
                onPress={() => {
                  setModerator(undefined);
                  setLocalModerator('');
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
