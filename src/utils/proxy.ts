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
          return orig.apply(obj, args);
        };
      }

      return typeof orig === "function" ? orig.bind(obj) : orig;
    },
  });
