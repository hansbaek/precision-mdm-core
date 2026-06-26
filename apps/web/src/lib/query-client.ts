import { QueryClient } from '@tanstack/react-query';

/**
 * 앱 전역 단일 QueryClient.
 * MDM은 인증 후 내부 어드민 도구이므로, 참조 데이터(표준코드·통계 등)는
 * 적당히 신선하게 유지하되 불필요한 재조회로 Oracle 부하를 키우지 않도록
 * 보수적인 기본값을 둔다. 개별 쿼리에서 staleTime/refetchInterval로 덮어쓴다.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30초 동안은 신선한 것으로 간주 — 화면 전환·재마운트 시 재요청 억제.
      staleTime: 30_000,
      // 일시적 네트워크 오류만 한 번 재시도(과한 재시도로 Oracle 부하 방지).
      retry: 1,
      // 창 포커스마다 재조회하면 어드민 도구에선 거슬리므로 끈다.
      refetchOnWindowFocus: false,
    },
  },
});
