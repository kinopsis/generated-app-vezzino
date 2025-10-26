import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthStore, User } from '@shared/types';
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user: User, token: string) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'agora-edge-auth', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);