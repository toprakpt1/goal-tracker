import { create } from 'zustand';

interface DbState {
  /** Incremented after every write so hooks know to re-run their queries. */
  version: number;
  bump: () => void;
}

export const useDbStore = create<DbState>((set) => ({
  version: 0,
  bump: () => set((state) => ({ version: state.version + 1 })),
}));

export function notifyDataChanged(): void {
  useDbStore.getState().bump();
}
