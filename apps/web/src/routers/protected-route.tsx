import { useAuthStore } from "@/hooks/use-auth-store";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Navigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const userProfile = useUserProfile((state) => state.userProfile);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
