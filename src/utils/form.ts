import { createFormHookContexts } from "@tanstack/react-form";
import type { StandardSchemaV1Issue } from "@tanstack/react-form";
import { isNonNullish } from "remeda";
import type { AppFormApi } from "~/hooks/use-app-form";

export type FieldError =
	| (StandardSchemaV1Issue | undefined)
	| (StandardSchemaV1Issue | undefined)[];

export const getErrorState = ({ fieldError }: { fieldError?: FieldError }) => {
	const fieldErrorMessages = (
		Array.isArray(fieldError) ? fieldError : [fieldError].filter(Boolean)
	)
		.filter(isNonNullish)
		.map(({ message }) => message)
		.filter(isNonNullish);
	return {
		errors: fieldErrorMessages,
		isWarning: fieldErrorMessages.length !== 0,
	};
};

export const getAllErrors = <F>(formApi: AppFormApi<F>) =>
	getErrorState({
		fieldError: formApi.getAllErrors().form.errors,
	}).errors.join("\n");

export const { useFormContext, fieldContext, formContext } =
	createFormHookContexts();
