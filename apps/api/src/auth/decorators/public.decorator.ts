import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** JWT 인증을 건너뛰는 공개 라우트 표시 (예: /auth/signin, /health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
