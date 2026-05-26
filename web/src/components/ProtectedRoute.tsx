import { Navigate } from 'react-router';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userData } = useUser();

  if (!userData || !userData.isNativeSpeaker) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
