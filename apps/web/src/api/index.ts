import axios from "axios";
import {
  AUTH_FORCE_LOGOUT_EVENT,
  LOCALSTORAGE_REFRESH_TOKEN,
  LOCALSTORAGE_TOKEN,
} from "@/constants";
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

// refresh 를 거치면 안 되는 인증 엔드포인트(재귀/무한루프 방지).
const AUTH_PATHS = ["/auth/refresh", "/auth/signin", "/auth/logout"];
const isAuthPath = (url?: string) =>
  !!url && AUTH_PATHS.some((p) => url.includes(p));

// 동시에 여러 요청이 401 이어도 refresh 는 한 번만 수행한다(single-flight).
let refreshing: Promise<string | null> | null = null;

/** 리프레시 토큰으로 액세스 토큰 갱신. 성공 시 새 액세스 토큰, 실패 시 null. */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(LOCALSTORAGE_REFRESH_TOKEN);
  if (!refreshToken) return null;
  try {
    // 인터셉터 재귀를 피하기 위해 기본 axios 로 호출한다.
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    const data = res.data as CommonReturnType<{
      token: string;
      refreshToken: string;
    }>;
    if (data?.ok && data.result) {
      localStorage.setItem(LOCALSTORAGE_TOKEN, data.result.token);
      localStorage.setItem(LOCALSTORAGE_REFRESH_TOKEN, data.result.refreshToken);
      return data.result.token;
    }
    return null;
  } catch {
    return null;
  }
}

// 동일 401 폭주(여러 요청 동시 만료) 시 토스트/이벤트가 중복 발행되지 않도록.
let forcingLogout = false;

/**
 * 세션 강제 종료 → 로그인 화면으로(soft redirect).
 * 저수준 api 계층은 라우터 컨텍스트 밖이므로 직접 navigate 할 수 없다.
 * 토큰만 제거하고 전역 이벤트를 발행해, 라우터 안의 워처가 스토어/쿼리 캐시
 * 정리 + 라우팅을 담당한다(full reload 회피로 SPA 상태 보존).
 */
function forceLogout() {
  localStorage.removeItem(LOCALSTORAGE_TOKEN);
  localStorage.removeItem(LOCALSTORAGE_REFRESH_TOKEN);
  if (forcingLogout) return;
  forcingLogout = true;
  toast.error("세션이 만료되었습니다. 다시 로그인해 주세요.", { duration: 2000 });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
  }
  // 새 세션이 시작되면 다시 발행 가능하도록 리셋.
  setTimeout(() => {
    forcingLogout = false;
  }, 2000);
}

// 공통 Response 및 Error 처리: 401 시 refresh 1회 시도 후 원요청 재시도.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status as number | undefined;
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthPath(original.url)
    ) {
      original._retry = true;
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;
      if (newToken) {
        // 재요청 시 request 인터셉터가 갱신된 토큰을 다시 부착한다.
        return axiosInstance(original);
      }
      forceLogout();
      return Promise.reject(error);
    }

    // refresh 자체 실패 또는 재시도 후에도 401 → 세션 종료.
    if (status === 401) {
      forceLogout();
    }

    return Promise.reject(error);
  },
);

export const getIsLoggedIn = () => {
  return typeof window !== "undefined" ? Boolean(localStorage.getItem(LOCALSTORAGE_TOKEN)) : false;
};

/** 다운로드 파일명용 타임스탬프 (년월일시분, YYYYMMDDHHmm). */
export const fileTimestamp = (d: Date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}`;
};

export const getUserProfile = (): Promise<CommonReturnType<UserProfile>> =>
  axiosInstance.get("/me").then((res) => res.data);
