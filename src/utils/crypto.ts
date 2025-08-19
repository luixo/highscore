export const getUuid = () =>
  typeof window === "undefined" ? "none" : window.crypto?.randomUUID?.();
