import React from "react";

import { addToast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAppForm } from "~/hooks/use-app-form";
import type { EventId } from "~/server/schemas";
import { moderatorKeySchema, moderatorNameSchema } from "~/server/schemas";
import { getAllErrors } from "~/utils/form";
import { useTranslation } from "~/utils/i18n";
import { useTRPC } from "~/utils/trpc";

const formSchema = z.strictObject({
  name: moderatorNameSchema,
  key: moderatorKeySchema,
});

export const AddModeratorForm: React.FC<{ eventId: EventId }> = ({
  eventId,
}) => {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({ name: "", key: "" }),
    [],
  );
  const addModeratorMutation = useMutation(
    trpc.moderator.add.mutationOptions({
      onSuccess: (result) => {
        addToast({
          title: t("common.success"),
          description: t("addModerator.toast.description", {
            name: result.name,
          }),
          color: "success",
        });
        form.reset(getDefaultValues());
        queryClient.setQueryData(
          trpc.moderator.list.queryKey({ eventId }),
          (prevModerators = []) => [
            ...prevModerators,
            { ...result, role: "moderator" as const },
          ],
        );
      },
    }),
  );
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      addModeratorMutation.mutate({
        eventId,
        name: value.name,
        key: value.key,
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
  return (
    <form.AppForm>
      <form.Form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <h3 className="text-2xl font-semibold">{t("addModerator.title")}</h3>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t("addModerator.form.name.label")}
              value={field.state.value}
              onValueChange={field.setValue}
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          )}
        </form.AppField>
        <form.AppField name="key">
          {(field) => (
            <field.TextField
              label={t("addModerator.form.key.Label")}
              value={field.state.value}
              onValueChange={field.setValue}
              name={field.name}
              onBlur={field.handleBlur}
              fieldError={
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          )}
        </form.AppField>
        <form.SubmitButton>{t("addModerator.form.button")}</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
