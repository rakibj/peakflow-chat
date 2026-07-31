let webComponentsLoadPromise: Promise<unknown> | undefined;

export const ensureWebComponentsLoaded = () => {
  if (typeof window === "undefined") return;

  webComponentsLoadPromise ??= import("./web");
  return webComponentsLoadPromise;
};
