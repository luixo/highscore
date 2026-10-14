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
	key: moderatorKeySchema,
	name: moderatorNameSchema,
});

export const AddModeratorForm: React.FC<{ eventId: EventId }> = ({
	eventId,
}) => {
	const trpc = useTRPC();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const getDefaultValues = React.useCallback(
		(): z.infer<typeof formSchema> => ({ key: "", name: "" }),
		[],
	);
	const addModeratorMutation = useMutation(
		trpc.moderator.add.mutationOptions({
			onSuccess: (result) => {
				addToast({
					color: "success",
					description: t("addModerator.toast.description", {
						name: result.name,
					}),
					title: t("common.success"),
				});
				// oxlint-disable-next-line no-use-before-define
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
		onSubmit: ({ value }) => {
			addModeratorMutation.mutate({
				eventId,
				key: value.key,
				name: value.name,
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
			onChange: formSchema,
		},
	});
	return (
		<form.AppForm>
			<form.Form
				className="w-full"
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
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
