import type { ComponentProps, FC } from "react";

import { CiCircleRemove } from "react-icons/ci";
import { twMerge } from "tailwind-merge";

export const RemoveButton: FC<
  ComponentProps<typeof CiCircleRemove> & { isDisabled?: boolean }
> = ({ className, isDisabled, ...props }) => (
  <CiCircleRemove
    className={twMerge(
      "text-danger size-6",
      isDisabled ? "opacity-50" : "cursor-pointer",
      className,
    )}
    {...props}
    onClick={isDisabled ? undefined : props.onClick}
  />
);
