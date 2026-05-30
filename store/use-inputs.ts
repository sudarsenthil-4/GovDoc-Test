import { create } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  inputs: Record<string, Record<string, unknown>>;
  setInput: (useCaseId: string, inputId: string, value: unknown) => void;
  clear: (useCaseId: string) => void;
};

export const useInputsStore = create<Store>()(
  persist(
    (set) => ({
      inputs: {},
      setInput: (useCaseId, inputId, value) =>
        set((s) => ({
          inputs: { ...s.inputs, [useCaseId]: { ...(s.inputs[useCaseId] ?? {}), [inputId]: value } },
        })),
      clear: (useCaseId) =>
        set((s) => {
          const next = { ...s.inputs };
          delete next[useCaseId];
          return { inputs: next };
        }),
    }),
    { name: "govdoc-inputs" },
  ),
);
