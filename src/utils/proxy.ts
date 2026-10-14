export const proxyMethods = <T extends object>(target: T, hooks: Partial<T>) =>
	new Proxy(target, {
		get(obj, prop) {
			const orig = obj[prop as keyof typeof obj];

			if (typeof orig === "function" && prop in hooks) {
				return (...args: unknown[]) => {
					(hooks[prop as keyof typeof obj] as (...args: unknown[]) => void)(
						...args,
						obj,
					);
					// oxlint-disable-next-line typescript/no-unsafe-return
					return orig.apply(obj, args);
				};
			}

			// oxlint-disable-next-line typescript/no-unsafe-return
			return typeof orig === "function" ? orig.bind(obj) : orig;
		},
	});
