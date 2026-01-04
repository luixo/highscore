import React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  addToast,
} from "@heroui/react";
import type { StandardSchemaV1Issue } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CiCircleCheck, CiCirclePlus, CiCircleRemove } from "react-icons/ci";
import { z } from "zod";

import { ModeratorContext } from "~/contexts/moderator-context";
import { useAppForm } from "~/hooks/use-app-form";
import {
  eventAliasSchema,
  eventNameSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from "~/server/schemas";
import { getAllErrors } from "~/utils/form";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

const formSchema = z.strictObject({
  title: eventNameSchema,
  adminKey: moderatorKeySchema,
  adminName: moderatorNameSchema,
  alias: eventAliasSchema.optional(),
});
const getDefaultValues = (): z.infer<typeof formSchema> => ({
  title: "",
  adminKey: "",
  adminName: "",
  alias: undefined,
});

export const CreateEventModal: React.FC = () => {
  const trpc = useTRPC();
  const { t } = useTranslation();

  const verifyAliasMutation = useMutation(
    trpc.events.aliasAvailable.mutationOptions(),
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  const router = useRouter();
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
        alias: value.alias || undefined,
      });
    },
    onSubmitInvalid: ({ formApi }) => {
      addToast({
        title: t("common.error"),
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
          title: t("common.success"),
          description: t("createEvent.toast.description", {
            title: result.title,
          }),
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
              <ModalHeader>{t("createEvent.title")}</ModalHeader>
              <ModalBody className="w-full">
                <form.AppField name="title">
                  {(field) => (
                    <field.TextField
                      label={t("createEvent.form.title.label")}
                      isRequired
                      placeholder={t("createEvent.form.title.placeholder")}
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
                <form.AppField
                  name="alias"
                  asyncDebounceMs={500}
                  validators={{
                    onChangeAsync: async ({ value, fieldApi }) => {
                      if (!fieldApi.getMeta().isValid || !value) {
                        return undefined;
                      }
                      const result = await verifyAliasMutation.mutateAsync({
                        alias: value,
                      });
                      return result
                        ? undefined
                        : ({
                            message: t("createEvent.form.alias.error"),
                            path: ["alias"],
                          } satisfies StandardSchemaV1Issue);
                    },
                  }}
                >
                  {(field) => (
                    <field.TextField
                      label={t("createEvent.form.alias.label")}
                      placeholder={t("createEvent.form.alias.placeholder")}
                      autoCapitalize="off"
                      endContent={
                        field.state.meta.isDefaultValue ? null : field.state
                            .meta.isValidating ? (
                          <Spinner size="sm" />
                        ) : field.state.meta.isValid ? (
                          <CiCircleCheck className="text-success-700 size-5" />
                        ) : (
                          <CiCircleRemove className="text-danger-700 size-5" />
                        )
                      }
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
                      label={t("createEvent.form.adminName.label")}
                      isRequired
                      placeholder={t("createEvent.form.adminName.placeholder")}
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
                      label={t("createEvent.form.adminKey.label")}
                      isRequired
                      placeholder={t("createEvent.form.adminKey.placeholder")}
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
                <form.SubmitButton>
                  {t("createEvent.form.submitButton")}
                </form.SubmitButton>
              </ModalFooter>
            </form.Form>
          </form.AppForm>
        </ModalContent>
      </Modal>
    </>
  );
};
