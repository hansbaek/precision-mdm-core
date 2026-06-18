import { LOCALSTORAGE_REFRESH_TOKEN, LOCALSTORAGE_TOKEN } from "@/constants";
import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  /** 액세스 + 리프레시 토큰을 함께 저장. */
  login: (token: string, refreshToken: string) => void;
  /** 로컬 토큰만 제거(서버 폐기는 use-session 의 signOut 이 담당). */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn:
    typeof window !== "undefined"
      ? Boolean(localStorage.getItem(LOCALSTORAGE_TOKEN))
      : false,
  login: (token, refreshToken) => {
    localStorage.setItem(LOCALSTORAGE_TOKEN, token);
    localStorage.setItem(LOCALSTORAGE_REFRESH_TOKEN, refreshToken);
    set({ isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem(LOCALSTORAGE_TOKEN);
    localStorage.removeItem(LOCALSTORAGE_REFRESH_TOKEN);
    set({ isLoggedIn: false });
  },
}));
