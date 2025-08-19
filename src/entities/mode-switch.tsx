import React from "react";

import { CiDark, CiLight } from "react-icons/ci";

import { Switch } from "~/components/switch";
import { useMounted } from "~/hooks/use-mounted";

export const ModeSwitch = () => {
  const [mode, setMode] = React.useState<"light" | "dark" | "auto">("auto");
  const isMounted = useMounted();
  const [autoMode] = React.useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme:dark)").matches
      ? "dark"
      : "light";
  });
  const actualMode = mode === "auto" ? autoMode : mode;
  React.useEffect(() => {
    if (actualMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [actualMode]);
  return (
    <Switch
      isSelected={isMounted ? actualMode === "dark" : false}
      onValueChange={(selected) => setMode(selected ? "dark" : "light")}
      color="default"
      endContent={<CiDark />}
      size="lg"
      startContent={<CiLight />}
    />
  );
};
