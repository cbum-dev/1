"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import AuthDialog from "@/components/auth-dialog";
import { getToken, removeToken, removeUser } from "@/lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check if user has token
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    removeToken();
    removeUser();
    setIsLoggedIn(false);
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6">
        <nav className="flex w-[min(920px,92vw)] items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">ManimFlow</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/80">
            <Link href="/" className="hover:text-white transition cursor-pointer">
              Home
            </Link>
            <Link href="/studio" className="hover:text-white transition cursor-pointer">
              Studio
            </Link>
            <Link href="/docs" className="hover:text-white transition cursor-pointer">
              Docs
            </Link>

            {isLoggedIn ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/10 cursor-pointer"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="hover:text-white transition cursor-pointer hidden sm:block bg-transparent border-none"
                >
                  Log in
                </button>
                <Button
                  size="sm"
                  className="rounded-full cursor-pointer bg-white text-black hover:bg-white/90"
                  onClick={() => openAuth('register')}
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            <ThemeToggle />
          </div>
        </nav>
      </header>

      <AuthDialog
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setIsLoggedIn(true);
        }}
        defaultMode={authMode}
      />
    </>
  );
}
