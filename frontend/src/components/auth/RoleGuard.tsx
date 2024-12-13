import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { debug } from '@/lib/utils/debug';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    debug.log('RoleGuard check:', {
      user: user?.email,
      roles: user?.roles,
      allowedRoles,
      hasAccess: user && user.roles?.some(role => allowedRoles.includes(role)),
      details: {
        userRoles: user?.roles,
        requiredRoles: allowedRoles,
        matches: user?.roles?.filter(role => allowedRoles.includes(role)),
        exactComparison: `[${user?.roles?.join(', ')}] overlaps with [${allowedRoles.join(', ')}]`
      }
    });
  }, [user, allowedRoles]);

  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Then check role access
  if (!user?.roles?.some(role => allowedRoles.includes(role))) {
    debug.log('Access denied - insufficient permissions:', {
      userEmail: user?.email,
      userRoles: user?.roles,
      requiredRoles: allowedRoles
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
