import { LOCALSTORAGE_TOKEN } from "@/constants";
import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: typeof window !== "undefined" ? Boolean(localStorage.getItem(LOCALSTORAGE_TOKEN)) : false,
  login: (token) => {
    localStorage.setItem(LOCALSTORAGE_TOKEN, token);
    set({
      isLoggedIn: true,
    });
  },
  logout: () => {
    localStorage.removeItem(LOCALSTORAGE_TOKEN);
    set({ isLoggedIn: false });
  },
}));
