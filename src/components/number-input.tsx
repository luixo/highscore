import type React from "react";
import { NumberInput as NumberInputRaw } from "@heroui/number-input";
import { getErrorState } from "~/utils/form";
import type { FieldError } from "~/utils/form";

type Props = React.ComponentProps<typeof NumberInputRaw> & {
	fieldError?: FieldError;
};

export const NumberInput: React.FC<Props> = ({ fieldError, ...props }) => {
	const { isWarning, errors } = getErrorState({ fieldError });
	return (
		<NumberInputRaw
			{...props}
			color={isWarning ? "warning" : props.color}
			description={errors.join("\n")}
		/>
	);
};
