import React from "react";

import { Form as FormRaw } from "@heroui/react";

import { useFormContext } from "~/utils/form";

export const Form: React.FC<React.ComponentProps<typeof FormRaw>> = ({
  onSubmit: onSubmitRaw,
  ...props
}) => {
  const form = useFormContext();
  const onSubmit = React.useCallback<React.FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      void form.handleSubmit();
      onSubmitRaw?.(e);
    },
    [form, onSubmitRaw],
  );
  return <FormRaw {...props} onSubmit={onSubmit} />;
};
