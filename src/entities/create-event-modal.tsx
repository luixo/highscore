import React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CiCirclePlus } from "react-icons/ci";
import { z } from "zod";

import { ModeratorContext } from "~/contexts/moderator-context";
import { useAppForm } from "~/hooks/use-app-form";
import {
  eventNameSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from "~/server/schemas";
import { getAllErrors } from "~/utils/form";
import { useTRPC } from "~/utils/trpc";

const formSchema = z.strictObject({
  title: eventNameSchema,
  adminKey: moderatorKeySchema,
  adminName: moderatorNameSchema,
});

export const CreateEventModal: React.FC = () => {
  const trpc = useTRPC();
  const [modalOpen, setModalOpen] = React.useState(false);
  const router = useRouter();
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({
      title: "",
      adminKey: "",
      adminName: "",
    }),
    [],
  );
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      addEventMutation.mutate({
        title: value.title,
        adminKey: value.adminKey,
        adminName: value.adminName,
      });
    },
    onSubmitInvalid: ({ formApi }) => {
      addToast({
        title: "Ошибка",
        description: getAllErrors(formApi),
        color: "danger",
      });
    },
  });
  const [, setKeys] = React.use(ModeratorContext);
  const addEventMutation = useMutation(
    trpc.events.add.mutationOptions({
      onSuccess: (result, variables) => {
        addToast({
          title: "Успех",
          description: `Событие "${result.title}" добавлено`,
          color: "success",
        });
        form.reset(getDefaultValues());
        router.navigate({
          to: "/events/$id",
          params: { id: result.id },
        });
        setKeys((prevKeys) => ({
          ...prevKeys,
          [result.id]: variables.adminKey,
        }));
      },
    }),
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
          <form.AppForm>
            <form.Form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <ModalHeader>Новое событие</ModalHeader>
              <ModalBody className="w-full">
                <form.AppField name="title">
                  {(field) => (
                    <field.TextField
                      label="Название"
                      isRequired
                      placeholder="Супер игры"
                      value={field.state.value}
                      onValueChange={field.setValue}
                      name={field.name}
                      onBlur={field.handleBlur}
                      fieldError={
                        field.state.meta.isDirty
                          ? field.state.meta.errors
                          : undefined
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="adminName">
                  {(field) => (
                    <field.TextField
                      label="Имя администратора"
                      isRequired
                      placeholder="Василий"
                      value={field.state.value}
                      onValueChange={field.setValue}
                      name={field.name}
                      onBlur={field.handleBlur}
                      fieldError={
                        field.state.meta.isDirty
                          ? field.state.meta.errors
                          : undefined
                      }
                    />
                  )}
                </form.AppField>
                <form.AppField name="adminKey">
                  {(field) => (
                    <field.TextField
                      label="Ключ администратора"
                      isRequired
                      placeholder="очень-секретное-значение"
                      value={field.state.value}
                      onValueChange={field.setValue}
                      name={field.name}
                      onBlur={field.handleBlur}
                      fieldError={
                        field.state.meta.isDirty
                          ? field.state.meta.errors
                          : undefined
                      }
                    />
                  )}
                </form.AppField>
              </ModalBody>
              <ModalFooter className="w-full">
                <form.SubmitButton>Создать</form.SubmitButton>
              </ModalFooter>
            </form.Form>
          </form.AppForm>
        </ModalContent>
      </Modal>
    </>
  );
};
