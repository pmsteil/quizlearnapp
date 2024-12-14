import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth.context';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function SignupDialog() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signup(name, email, password);
      toast({
        title: "Account Created",
        description: "Welcome to QuizLearn!",
        variant: "default"
      });
    } catch (error: any) {
      // console.error('Signup error:', error);
      // Convert error object to string for display
      let errorMessage = "Failed to create account";

      if (error instanceof Error) {
        // console.error('Error message:', error.message);
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        // console.error('Error message:', error.toString());
        errorMessage = error.toString();
      }

      // if errorMessage is still an object, convert it to a string
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
        // console.error('Error message converted to string:', errorMessage);
      }

      console.log('Error during signup:', errorMessage);

      toast({
        title: "Registration Failed!",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Create an Account</DialogTitle>
        <DialogDescription>
          Sign up to start your learning journey with QuizLearn.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
