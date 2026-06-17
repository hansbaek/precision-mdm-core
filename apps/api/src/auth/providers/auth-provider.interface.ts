/**
 * 인증 추상화. 1차는 LocalAuthProvider(bcrypt), 추후 SsoAuthProvider(그룹웨어)로
 * 교체 가능하다. JWT 발급/검증·가드는 이 인터페이스에 의존하지 않는다.
 */
export interface AuthenticatedUser {
  userId: string;
  userNm: string;
  userNmEng: string;
  teamNm: string;
  teamNmEng: string;
  roleId: string;
}

export interface AuthProvider {
  /** 자격 증명 검증. 성공 시 사용자, 실패 시 null. */
  authenticate(
    userId: string,
    password: string,
  ): Promise<AuthenticatedUser | null>;
}

export const AUTH_PROVIDER_TOKEN = Symbol('AUTH_PROVIDER');
