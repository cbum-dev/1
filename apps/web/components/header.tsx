"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth-dialog";
import { getToken, removeToken, removeUser } from "@/lib/api";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user has token
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    removeToken();
    removeUser();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
        <nav className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-3 backdrop-blur-xl shadow-lg relative z-50">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">ManimFlow</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link href="/" className="hover:text-white transition cursor-pointer">
              Home
            </Link>
            {isLoggedIn && (
              <Link href="/studio" className="hover:text-white transition cursor-pointer">
                Studio
              </Link>
            )}
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
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl pt-32 px-6 flex flex-col items-center gap-8 md:hidden">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-white/90 hover:text-white">
              Home
            </Link>
            {isLoggedIn && (
              <Link href="/studio" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-white/90 hover:text-white">
                Studio
              </Link>
            )}
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-white/90 hover:text-white">
              Docs
            </Link>

            <div className="h-px w-full bg-white/10 my-4" />

            {isLoggedIn ? (
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/10 cursor-pointer w-full text-lg"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <Button
                  variant="ghost"
                  onClick={() => openAuth('login')}
                  className="text-white hover:bg-white/10 w-full text-lg"
                >
                  Log in
                </Button>
                <Button
                  size="lg"
                  className="rounded-full cursor-pointer bg-white text-black hover:bg-white/90 w-full text-lg h-12"
                  onClick={() => openAuth('register')}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
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
