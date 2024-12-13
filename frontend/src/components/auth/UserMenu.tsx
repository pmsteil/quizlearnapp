import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { AuthDialog } from './AuthDialog';
import { useState } from 'react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full"
          onClick={() => setShowAuthDialog(true)}
        >
          <span className="text-lg">?</span>
        </Button>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-secondary"
        >
          <span className="text-lg">
            {user.name && user.name.split ? user.name.split(' ').map(n => n[0]).join('') : '?'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="font-medium">
          {user.name && typeof user.name === 'string' ? user.name : 'User'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
