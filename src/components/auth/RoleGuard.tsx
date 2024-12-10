import { useAuth } from '@/lib/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { debug } from '@/lib/utils/debug';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  debug.log('RoleGuard Check:', {
    user: user ? {
      email: user.email,
      role: user.role,
      // Log the full user object in development
      _debug_full_user: process.env.NODE_ENV === 'development' ? user : undefined
    } : null,
    allowedRoles,
    hasAccess: user && allowedRoles.includes(user.role),
    roleMatch: user ? {
      userRole: user.role,
      expectedRole: allowedRoles[0],
      matches: allowedRoles.includes(user.role),
      exactComparison: `'${user.role}' === '${allowedRoles[0]}'`
    } : null
  });

  if (!user || !allowedRoles.includes(user.role)) {
    debug.log('Access denied, redirecting to home', {
      reason: !user ? 'No user' : 'Role mismatch',
      userRole: user?.role,
      requiredRoles: allowedRoles
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
