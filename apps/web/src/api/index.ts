import axios from "axios";
import { LOCALSTORAGE_TOKEN } from "@/constants";
import { toast } from "sonner";
import { type UserProfile } from "@/types";

export const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

export interface CommonReturnType<T> {
  result?: T;
  ok: boolean;
  error?: string;
}

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  // headers: {"Authorization":`Bearer ${token}`} 여기서 이렇게 해줄수도 있지만 초기 인스턴스 생성시점이 아닌 요청시점마다 토큰이 존재하는지 확인하도록 하기 위해 request에 공통으로 넣었음
});

axiosInstance.interceptors.request.use((config) => {
  /* JWT 토큰 */
  const token = localStorage.getItem(LOCALSTORAGE_TOKEN);

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// 공통 Response 및 Error 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status && error.response.status === 401) {
        toast.error("Invalid login token", {
          duration: 700,
          onAutoClose: () => {
            localStorage.removeItem(LOCALSTORAGE_TOKEN);
            document.location.href = "/";
          },
        });
      }
    }

    return Promise.reject(error);
  },
);

export const getIsLoggedIn = () => {
  return typeof window !== "undefined" ? Boolean(localStorage.getItem(LOCALSTORAGE_TOKEN)) : false;
};

export const getUserProfile = (): Promise<CommonReturnType<UserProfile>> =>
  axiosInstance.get("/me").then((res) => res.data);
