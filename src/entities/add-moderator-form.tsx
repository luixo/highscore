import React from "react";

import { addToast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAppForm } from "~/hooks/use-app-form";
import type { EventId } from "~/server/schemas";
import { moderatorKeySchema, moderatorNameSchema } from "~/server/schemas";
import { getAllErrors } from "~/utils/form";
import { useTRPC } from "~/utils/trpc";

const formSchema = z.strictObject({
  name: moderatorNameSchema,
  key: moderatorKeySchema,
});

export const AddModeratorForm: React.FC<{ eventId: EventId }> = ({
  eventId,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({ name: "", key: "" }),
    [],
  );
  const addModeratorMutation = useMutation(
    trpc.moderator.add.mutationOptions({
      onSuccess: (result) => {
        addToast({
          title: "Успех",
          description: `Модератор "${result.name}" добавлен`,
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
        title: "Ошибка",
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
        <h3 className="text-2xl font-semibold">Добавить модератора</h3>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label="Имя"
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
              label="Ключ модератора"
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
        <form.SubmitButton>Добавить</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
