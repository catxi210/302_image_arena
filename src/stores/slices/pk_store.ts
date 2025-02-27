import { atomWithStorage, createJSONStorage } from "jotai/utils";

export interface PkState {
  historyId: string | null;
  isGenerating: boolean;
  elapsedTime: {
    left: number;
    right: number;
  };
}

export const pkStateAtom = atomWithStorage<PkState>(
  "pkState",
  {
    historyId: null,
    isGenerating: false,
    elapsedTime: {
      left: 0,
      right: 0,
    },
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);
