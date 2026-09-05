import { useContext } from "react";

import { PipContext } from "@/context/pip-context";

export function usePip() {
  const context = useContext(PipContext);

  if (!context) {
    throw new Error("usePip must be used within a PipProvider");
  }

  return context;
}
