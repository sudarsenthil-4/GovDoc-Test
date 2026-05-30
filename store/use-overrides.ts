import { create } from "zustand";

export type OverrideEntry = {
  category: string;
  oldValue: unknown;
  newValue: unknown;
  ts: number;
  reason: string;
};

type Store = {
  history: OverrideEntry[];
  redoStack: OverrideEntry[];
  push: (entry: Omit<OverrideEntry, "ts">) => void;
  undo: () => OverrideEntry | undefined;
  redo: () => OverrideEntry | undefined;
  clear: () => void;
};

export const useOverridesStore = create<Store>((set, get) => ({
  history: [],
  redoStack: [],
  push: (entry) => set((s) => ({ history: [...s.history, { ...entry, ts: Date.now() }], redoStack: [] })),
  undo: () => {
    const h = get().history;
    if (h.length === 0) return undefined;
    const entry = h[h.length - 1]!;
    set({ history: h.slice(0, -1), redoStack: [...get().redoStack, entry] });
    return entry;
  },
  redo: () => {
    const r = get().redoStack;
    if (r.length === 0) return undefined;
    const entry = r[r.length - 1]!;
    set({ history: [...get().history, entry], redoStack: r.slice(0, -1) });
    return entry;
  },
  clear: () => set({ history: [], redoStack: [] }),
}));
