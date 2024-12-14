import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/auth.context';
import { debug } from '@/lib/utils/debug';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('RoleGuard - Current state:', {
      path: location.pathname,
      user,
      userRoles: user?.roles,
      allowedRoles,
      isAuthenticated: !!user,
      hasRequiredRole: user?.roles?.some(role => allowedRoles.includes(role))
    });
  }, [user, allowedRoles, location]);

  // First check if user is authenticated
  if (!user) {
    console.log('RoleGuard - User not authenticated, redirecting to /', { user });
    return <Navigate to="/" replace />;
  }

  // Then check role access
  const hasRequiredRole = user.roles?.some(role => allowedRoles.includes(role));
  
  // Temporary: log roles and skip role check
  console.log('RoleGuard - Role check:', {
    userEmail: user.email,
    userRoles: user.roles,
    requiredRoles: allowedRoles,
    hasRequiredRole
  });

  // Temporarily comment out role check to debug
  /*
  if (!hasRequiredRole) {
    console.log('RoleGuard - Access denied:', {
      userEmail: user.email,
      userRoles: user.roles,
      requiredRoles: allowedRoles
    });
    return <Navigate to="/dashboard" replace />;
  }
  */

  console.log('RoleGuard - Access granted:', {
    userEmail: user.email,
    userRoles: user.roles,
    requiredRoles: allowedRoles
  });

  return <>{children}</>;
}
