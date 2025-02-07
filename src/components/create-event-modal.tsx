import type { FC } from 'react';
import { useCallback, useContext, useState } from 'react';
import { CiCirclePlus } from 'react-icons/ci';
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from '@nextui-org/react';
import { trpc } from '~/utils/trpc';
import {
  eventNameSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from '~/server/schemas';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { collectErrors } from '~/utils/form';
import toast from 'react-hot-toast';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { ModeratorContext } from '~/components/moderator-context';

const formSchema = z.strictObject({
  title: eventNameSchema,
  adminKey: moderatorKeySchema,
  adminName: moderatorNameSchema,
});

export const CreateEventModal: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const [, setKeys] = useContext(ModeratorContext);
  const addEventMutation = trpc.events.add.useMutation({
    onSuccess: (result, variables) => {
      toast.success(`Событие "${result.title}" добавлено`);
      form.reset();
      router.push(`/events/${result.id}`);
      setKeys((prevKeys) => ({ ...prevKeys, [result.id]: variables.adminKey }));
    },
  });
  const onSubmit = useCallback<SubmitHandler<z.infer<typeof formSchema>>>(
    (data) =>
      addEventMutation.mutate({
        title: data.title,
        adminKey: data.adminKey,
        adminName: data.adminName,
      }),
    [addEventMutation],
  );
  const onError = useCallback<SubmitErrorHandler<z.infer<typeof formSchema>>>(
    (errors) => toast.error(collectErrors(errors).join('\n')),
    [],
  );
  return (
    <>
      <Button
        color="primary"
        variant="flat"
        isIconOnly
        onPress={() => setModalOpen(true)}
      >
        <CiCirclePlus size="24" />
      </Button>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          <Form onSubmit={form.handleSubmit(onSubmit, onError)}>
            <ModalHeader>Новое событие</ModalHeader>
            <ModalBody className="w-full">
              <Input
                {...form.register('title')}
                label="Название"
                isRequired
                placeholder="Супер игры"
                errorMessage={form.formState.errors.title?.message?.toString()}
                isInvalid={Boolean(form.formState.errors.title?.message)}
              />
              <Input
                {...form.register('adminName')}
                label="Имя администратора"
                isRequired
                placeholder="Василий"
                errorMessage={form.formState.errors.adminName?.message?.toString()}
                isInvalid={Boolean(form.formState.errors.adminName?.message)}
              />
              <Input
                {...form.register('adminKey')}
                label="Ключ администратора"
                isRequired
                placeholder="очень-секретное-значение"
                errorMessage={form.formState.errors.adminKey?.message?.toString()}
                isInvalid={Boolean(form.formState.errors.adminKey?.message)}
              />
            </ModalBody>
            <ModalFooter className="w-full">
              <Tooltip
                isDisabled={form.formState.isValid}
                content={collectErrors(form.formState.errors)}
              >
                <div>
                  <Button
                    type="submit"
                    color="primary"
                    className="self-end"
                    isDisabled={!form.formState.isValid}
                  >
                    Создать
                  </Button>
                </div>
              </Tooltip>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};
