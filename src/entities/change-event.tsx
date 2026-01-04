import React from "react";

import { Spinner, addToast } from "@heroui/react";
import type { StandardSchemaV1Issue } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { CiCircleCheck, CiCircleRemove } from "react-icons/ci";
import { z } from "zod";

import { useAppForm } from "~/hooks/use-app-form";
import { eventAliasSchema, eventNameSchema } from "~/server/schemas";
import { getAllErrors } from "~/utils/form";
import { useTranslation } from "~/utils/i18n";
import type { RouterOutput } from "~/utils/query";
import { useTRPC } from "~/utils/trpc";

const formSchema = z.strictObject({
  title: eventNameSchema,
  alias: eventAliasSchema.optional(),
});

export const ChangeEvent: React.FC<{
  event: RouterOutput["events"]["get"];
}> = ({ event }) => {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const router = useRouter();

  const verifyAliasMutation = useMutation(
    trpc.events.aliasAvailable.mutationOptions(),
  );
  const getDefaultValues = React.useCallback(
    (): z.infer<typeof formSchema> => ({
      title: event.title,
      alias: event.alias,
    }),
    [event.alias, event.title],
  );
  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validators: {
      onChangeAsync: formSchema,
    },
    onSubmit: ({ value }) => {
      updateEventMutation.mutate({
        id: event.id,
        title: value.title,
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
  const queryClient = useQueryClient();
  const updateEventMutation = useMutation(
    trpc.events.update.mutationOptions({
      onMutate: (variables) => {
        queryClient.setQueryData(
          trpc.events.get.queryKey({ id: event.id }),
          (prevData) => {
            if (!prevData) {
              return;
            }
            return {
              ...prevData,
              title: variables.title,
              alias: variables.alias,
            };
          },
        );
        if (variables.alias !== event.alias) {
          return variables.alias;
        }
      },
      onSuccess: (result, _variables, onMutateResult) => {
        addToast({
          title: t("common.success"),
          description: t("updateEvent.form.submitButton", {
            title: result.title,
          }),
          color: "success",
        });
        form.reset(getDefaultValues());
        if (onMutateResult) {
          router.navigate({
            to: "/events/$id",
            params: { id: onMutateResult },
            replace: true,
          });
        }
      },
    }),
  );
  return (
    <form.AppForm>
      <form.Form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField name="title">
          {(field) => (
            <field.TextField
              label={t("updateEvent.form.title.label")}
              isRequired
              placeholder={t("updateEvent.form.title.placeholder")}
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
                    message: t("updateEvent.form.alias.error"),
                    path: ["alias"],
                  } satisfies StandardSchemaV1Issue);
            },
          }}
        >
          {(field) => (
            <field.TextField
              label={t("updateEvent.form.alias.label")}
              isRequired
              placeholder={t("updateEvent.form.alias.placeholder")}
              endContent={
                field.state.meta.isDefaultValue ? null : field.state.meta
                    .isValidating ? (
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
                field.state.meta.isDirty ? field.state.meta.errors : undefined
              }
            />
          )}
        </form.AppField>
        <form.SubmitButton>
          {t("updateEvent.form.submitButton")}
        </form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};
