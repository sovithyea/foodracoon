import { create } from "zustand";
import type { ListWithCount } from "@/lib/lists";

export type ListsState = {
  lists: ListWithCount[];
  loaded: boolean;

  // Actions
  setLists: (lists: ListWithCount[]) => void;
  addList: (list: ListWithCount) => void;
  updateList: (id: string, updates: Partial<ListWithCount>) => void;
  removeList: (id: string) => void;
};

export const useListsStore = create<ListsState>((set) => ({
  lists: [],
  loaded: false,

  setLists: (lists) => set({ lists, loaded: true }),

  addList: (list) =>
    set((s) => ({
      lists: [...s.lists, list],
    })),

  updateList: (id, updates) =>
    set((s) => ({
      lists: s.lists.map((list) => (list.id === id ? { ...list, ...updates } : list)),
    })),

  removeList: (id) =>
    set((s) => ({
      lists: s.lists.filter((list) => list.id !== id),
    })),
}));
