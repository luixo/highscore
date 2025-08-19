import type { ComponentProps, FC } from "react";

import { CiCircleRemove } from "react-icons/ci";

export const RemoveButton: FC<
  ComponentProps<typeof CiCircleRemove> & { isDisabled?: boolean }
> = ({ className, isDisabled, ...props }) => (
  <CiCircleRemove
    className={[
      "text-danger",
      isDisabled ? "opacity-50" : "cursor-pointer",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    size={24}
    {...props}
    onClick={isDisabled ? undefined : props.onClick}
  />
);
