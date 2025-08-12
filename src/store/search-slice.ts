import { StoreSlice } from './store';

export interface SearchSlice {
  searchHighlightTerm: string;
  setSearchHighlightTerm: (term: string) => void;
}

export const createSearchSlice: StoreSlice<SearchSlice> = (set, get) => ({
  searchHighlightTerm: '',
  setSearchHighlightTerm: (term: string) => {
    set({ searchHighlightTerm: term });
  },
});