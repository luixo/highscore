import type React from "react";

import { Switch as SwitchRaw } from "@heroui/switch";

import { type FieldError, getErrorState } from "~/utils/form";

type Props = React.ComponentProps<typeof SwitchRaw> & {
  fieldError?: FieldError;
};

export const Switch: React.FC<Props> = ({ fieldError, ...props }) => {
  const { isWarning, errors } = getErrorState({ fieldError });
  return (
    <SwitchRaw
      {...props}
      color={isWarning ? "warning" : props.color}
      description={errors.join("\n")}
    />
  );
};
