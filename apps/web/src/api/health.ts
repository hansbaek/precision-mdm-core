import { axiosInstance } from '.';

/** NestJS Terminus 헬스체크 응답. status가 'ok'면 모든 인디케이터 정상. */
export interface HealthResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string }>;
  details?: Record<string, { status: string }>;
}

/**
 * 백엔드 /health 엔드포인트 조회 (DB ping 포함, 인증 불필요).
 * Terminus는 비정상 시 HTTP 503으로 응답하므로, 503 본문도 함께 반환한다.
 */
export const getHealth = (): Promise<HealthResponse> =>
  axiosInstance
    .get<HealthResponse>('/health', {
      // 503(서비스 비정상)을 예외가 아닌 정상 응답으로 받아 본문을 읽는다.
      validateStatus: (status) => status === 200 || status === 503,
    })
    .then((res) => res.data);
