import { create } from 'zustand';
import type { Profile, Organization } from '../types';

interface AppStore {
  profile: Profile | null;
  org: Organization | null;
  openrouterKey: string;
  authLoading: boolean;

  setProfile: (profile: Profile | null) => void;
  setOrg: (org: Organization | null) => void;
  setOpenrouterKey: (key: string) => void;
  clearSession: () => void;
  loadPersistedSettings: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  org: null,
  openrouterKey: '',
  authLoading: true,

  setProfile: (profile) => set({ profile }),
  setOrg: (org) => set({ org }),
  setOpenrouterKey: (key) => {
    localStorage.setItem('cc_or_key', key);
    set({ openrouterKey: key });
  },
  clearSession: () => {
    set({ profile: null, org: null });
  },
  setAuthLoading: (authLoading) => set({ authLoading }),
  loadPersistedSettings: () => {
    const key = localStorage.getItem('cc_or_key') ?? '';
    set({ openrouterKey: key });
  },
}));
