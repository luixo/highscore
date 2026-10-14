import { heroui } from "@heroui/react";
import "react";

export default heroui();

declare module "react" {
	// Declaration merging requires an interface rather than a type alias.
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface CSSProperties {
		// Keep the template-literal index signature for CSS custom properties.
		// oxlint-disable-next-line typescript/consistent-indexed-object-style
		[key: `--${string}`]: string | number;
	}
}
