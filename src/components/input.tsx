import type React from "react";

import { Input as InputRaw, Textarea } from "@heroui/input";
import { twMerge } from "tailwind-merge";

import { type FieldError, getErrorState } from "~/utils/form";

type Props = Omit<
  React.ComponentProps<typeof InputRaw | typeof Textarea>,
  "ref"
> & {
  ref?: React.Ref<HTMLInputElement & HTMLTextAreaElement>;
  fieldError?: FieldError;
  multiline?: boolean;
};

export const Input: React.FC<Props> = ({
  fieldError,
  multiline,
  ref,
  ...props
}) => {
  const Component = multiline ? Textarea : InputRaw;
  const { isWarning, errors } = getErrorState({ fieldError });
  return (
    <Component
      ref={ref}
      {...props}
      color={isWarning ? "warning" : props.color}
      description={errors.join("\n")}
      classNames={{
        description: twMerge(
          "whitespace-pre",
          isWarning ? "text-warning" : undefined,
        ),
      }}
    />
  );
};
