import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { AUTH_FORCE_LOGOUT_EVENT } from '@/constants';
import { clearSession } from '@/hooks/use-session';
import { usePreferencesStore } from '@/hooks/use-preferences-store';
import { queryClient } from '@/lib/query-client';

/**
 * 세션 강제 종료 이벤트를 수신해 SPA 내에서 로그인 화면으로 soft-redirect 한다.
 *
 * - 스토어(auth·profile·permissions)와 환경설정을 초기화하고, 이전 사용자의
 *   응답이 캐시에 남아 새 세션으로 새지 않도록 쿼리 캐시를 비운다.
 * - full page reload 대신 navigate 로 전환해 번들/상태를 보존한다.
 *
 * 라우터 컨텍스트 안, 그리고 보호 라우트(App) 밖에 마운트해야 한다
 * (세션이 정리되면 App 이 언마운트되므로). {@link ForceLogoutWatcher} 참고.
 */
export function useForceLogoutListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      clearSession();
      // 공유 PC 등에서 이전 사용자의 표시 환경설정이 남지 않도록 초기화.
      usePreferencesStore.getState().reset();
      // 권한·참조 데이터 등 이전 세션 응답 잔존 방지.
      queryClient.clear();
      navigate('/login', { replace: true });
    };

    window.addEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_FORCE_LOGOUT_EVENT, handler);
  }, [navigate]);
}

/** 리스너만 등록하는 무표시 컴포넌트(라우터 안 최상단에 마운트). */
export function ForceLogoutWatcher() {
  useForceLogoutListener();
  return null;
}
