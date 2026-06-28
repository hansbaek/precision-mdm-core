export const LOCALSTORAGE_TOKEN = "boiler-token";
/** 리프레시 토큰 저장 키. 액세스 토큰 만료 시 갱신에 사용. */
export const LOCALSTORAGE_REFRESH_TOKEN = "boiler-refresh-token";
export const ZUSTAND_LOCAL_STORAGE = "boiler-auth-storage";
export const USER_ID_STORAGE = "userId_boiler";
/** 사용자 환경설정(표시 기본값) 저장 키. */
export const PREFERENCES_STORAGE = "tmdm-preferences";

/**
 * 세션 강제 종료(401·리프레시 실패) 시 발행되는 전역 이벤트.
 * 저수준 api 계층(라우터 컨텍스트 밖)에서 발행하고, 라우터 안의 워처가
 * 받아서 스토어/쿼리 캐시 정리 + 로그인 화면으로의 soft-redirect 를 수행한다.
 * (full page reload 를 피해 SPA 상태·번들을 보존.)
 */
export const AUTH_FORCE_LOGOUT_EVENT = "auth:force-logout";
