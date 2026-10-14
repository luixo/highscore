import { getLintConfig } from "@luixo/configs";

export default getLintConfig({
	ignorePatterns: [".output/", "**/*.gen.ts"],
	overrides: [
		{
			files: ["src/routes/**/*"],
			rules: {
				// We use Route before definition
				"eslint/no-use-before-define": "off",
			},
		},
		{
			env: {
				node: true,
			},
			files: ["src/server/**"],
		},
		{
			files: ["src/styles/heroui.ts"],
			rules: {
				"import/no-default-export": "off",
			},
		},
	],
	rules: {
		// We use a lot of magic numbers throughout the project
		"eslint/no-magic-numbers": "off",
		// TODO: Fix
		"import/no-cycle": "off",
		// We're not publishing this as a package
		"node/no-top-level-await": "off",
		// We don't have translations yet
		"react/jsx-no-literals": "off",
		// TODO: Fix
		"typescript/strict-boolean-expressions": "off",
		// There are false positives on `z.foo().catch()`
		"unicorn/prefer-top-level-await": "off",
	},
});
