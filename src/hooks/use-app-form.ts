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
  TextField: Input,
  NumberField: NumberInput,
  SwitchField: Switch,
};
const formComponents = {
  Form,
  SubmitButton,
};
export const { useAppForm, withFieldGroup } = createFormHook({
  fieldComponents,
  formComponents,
  fieldContext,
  formContext,
});

export type AppFormApi<F> = FormApi<
  F,
  /* eslint-disable @typescript-eslint/no-explicit-any */
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
  /* eslint-enable @typescript-eslint/no-explicit-any */
>;

export type AppForm<F> = AppFieldExtendedReactFormApi<
  F,
  /* eslint-disable @typescript-eslint/no-explicit-any */
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
  /* eslint-enable @typescript-eslint/no-explicit-any */
  typeof fieldComponents,
  typeof formComponents
>;
