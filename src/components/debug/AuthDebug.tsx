import { useAuth } from '@/lib/context/AuthContext';

export function AuthDebug() {
  const { user } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-muted/80 rounded-lg text-xs">
      <pre>
        {JSON.stringify({
          auth: {
            user: user ? {
              email: user.email,
              role: user.role
            } : null
          }
        }, null, 2)}
      </pre>
    </div>
  );
}
