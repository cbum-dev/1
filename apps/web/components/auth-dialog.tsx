'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { login, register, saveToken, saveUser } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthDialog({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when dialog opens/closes/mode changes
  // Ideally handled by useEffect or key, but simple state is fine.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const response = await login(email, password);
        saveToken(response.access_token);
        saveUser(response.user);
        onSuccess(response.user);
      } else {
        const response = await register(email, username, password);
        saveToken(response.access_token);
        saveUser(response.user);
        onSuccess(response.user);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl p-0 gap-0 overflow-hidden text-white">
        <div className="p-6 pt-8 text-center bg-white/5 border-b border-white/5">
          <div className="mx-auto flex items-center justify-center gap-2 text-primary mb-4">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight mb-1 text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {mode === 'login'
              ? 'Enter your details to sign in.'
              : 'Join ManimFlow to start creating.'}
          </DialogDescription>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500"
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'login' && (
                  <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 font-medium text-center bg-red-900/20 p-2 rounded border border-red-900/30">
                {error}
              </div>
            )}

            <Button className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={toggleMode} className="font-semibold text-indigo-400 hover:text-indigo-300 focus:outline-none hover:underline">
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}