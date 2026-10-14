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
	alias: eventAliasSchema.optional(),
	title: eventNameSchema,
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
			alias: event.alias,
			title: event.title,
		}),
		[event.alias, event.title],
	);
	const form = useAppForm({
		defaultValues: getDefaultValues(),
		onSubmit: ({ value }) => {
			// oxlint-disable-next-line no-use-before-define
			updateEventMutation.mutate({
				alias: value.alias ?? undefined,
				id: event.id,
				title: value.title,
			});
		},
		onSubmitInvalid: ({ formApi }) => {
			addToast({
				color: "danger",
				description: getAllErrors(formApi),
				title: t("common.error"),
			});
		},
		validators: {
			onChangeAsync: formSchema,
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
							alias: variables.alias,
							title: variables.title,
						};
					},
				);
				if (variables.alias !== event.alias) {
					return variables.alias;
				}
			},
			onSuccess: async (result, _variables, onMutateResult) => {
				addToast({
					color: "success",
					description: t("updateEvent.form.submitButton", {
						title: result.title,
					}),
					title: t("common.success"),
				});
				form.reset(getDefaultValues());
				if (onMutateResult !== undefined) {
					await router.navigate({
						params: { id: onMutateResult },
						replace: true,
						to: "/events/$id",
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
					void form.handleSubmit();
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
							if (!fieldApi.getMeta().isValid || value === undefined) {
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
							autoCapitalize="off"
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
