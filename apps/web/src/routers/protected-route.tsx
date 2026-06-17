import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePermissionsStore } from '@/hooks/use-permissions-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import { clearSession, loadSession } from '@/hooks/use-session';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const loaded = usePermissionsStore((state) => state.loaded);
  const userProfile = useUserProfile((state) => state.userProfile);
  const [failed, setFailed] = useState(false);

  // 토큰은 있으나 프로필/권한 미적재(새로고침) → 서버에서 재적재.
  useEffect(() => {
    if (isLoggedIn && !loaded) {
      loadSession().then((ok) => {
        if (!ok) {
          clearSession();
          setFailed(true);
        }
      });
    }
  }, [isLoggedIn, loaded]);

  if (!isLoggedIn || failed) {
    return <Navigate to="/login" replace />;
  }

  if (!loaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
