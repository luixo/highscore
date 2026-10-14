import type {
	AppFieldExtendedReactFormApi,
	FormApi,
} from "@tanstack/react-form";
import { createFormHook } from "@tanstack/react-form";
import { Form } from "~/components/form";
import { Input } from "~/components/input";
import { NumberInput } from "~/components/number-input";
import { SubmitButton } from "~/components/submit-button";
import { Switch } from "~/components/switch";
import { fieldContext, formContext } from "~/utils/form";

const fieldComponents = {
	NumberField: NumberInput,
	SwitchField: Switch,
	TextField: Input,
};
const formComponents = {
	Form,
	SubmitButton,
};
export const { useAppForm, withFieldGroup } = createFormHook({
	fieldComponents,
	fieldContext,
	formComponents,
	formContext,
});

export type AppFormApi<F> = FormApi<
	F,
	/* oxlint-disable @typescript-eslint/no-explicit-any */
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any
	/* oxlint-enable @typescript-eslint/no-explicit-any */
>;

export type AppForm<F> = AppFieldExtendedReactFormApi<
	F,
	/* oxlint-disable @typescript-eslint/no-explicit-any */
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	any,
	/* oxlint-enable @typescript-eslint/no-explicit-any */
	typeof fieldComponents,
	typeof formComponents
>;
