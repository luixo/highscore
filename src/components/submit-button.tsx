import type React from "react";

import { Button, Tooltip } from "@heroui/react";
import { twMerge } from "tailwind-merge";

import { getErrorState, useFormContext } from "~/utils/form";

export const SubmitButton: React.FC<React.ComponentProps<typeof Button>> = (
  props,
) => {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.errors] as const}
    >
      {([canSubmit, errors]) => (
        <Tooltip
          isDisabled={canSubmit}
          content={getErrorState({ fieldError: errors }).errors.join("\n")}
        >
          <div>
            <Button
              {...props}
              type="submit"
              color={props.color || "primary"}
              className={twMerge("self-end", props.className)}
              isDisabled={props.isDisabled || !canSubmit}
            />
          </div>
        </Tooltip>
      )}
    </form.Subscribe>
  );
};
