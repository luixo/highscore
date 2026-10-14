import { getFormatConfig } from "@luixo/configs";

export default getFormatConfig({
	imports: {
		groups: [
			"react",
			["builtin", "external"],
			"internal",
			"parent",
			"sibling",
			"index",
			"unknown",
		],
		customGroups: [
			{
				groupName: "react",
				elementNamePattern: ["react", "react-dom/client"],
			},
		],
	},
	ignorePatterns: [".output", "*.gen.ts"],
});
