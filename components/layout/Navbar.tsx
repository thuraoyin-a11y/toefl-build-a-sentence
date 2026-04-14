"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { useUserStore } from "@/store/userStore";
import { User, GraduationCap, LogOut } from "lucide-react";

/**
 * Apple Design System Navbar Component
 * 
 * Navigation in Apple's system:
 * - Background: rgba(0, 0, 0, 0.8) with backdrop-filter: saturate(180%) blur(20px)
 * - Height: 48px (compact)
 * - Text: white, 12px, weight 400
 * - Glass blur effect is essential to the Apple UI identity
 * - The nav floats above content, maintaining dark translucent glass
 */
export function Navbar({ className }: { className?: string }) {
  const router = useRouter();
  const { currentUser, isLoading, fetchUser, clearUser } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        clearUser(); // Clear user from store
        setIsMenuOpen(false);
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Determine home link based on user role
  const homeLink = currentUser?.role === "teacher" ? "/teacher" : "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-12 apple-nav-glass",
        className
      )}
    >
      <Container size="full" className="h-full">
        <div className="flex h-full items-center justify-between max-w-apple mx-auto px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-apple-sm bg-white flex items-center justify-center">
              <span className="text-apple-blue font-semibold text-micro-bold">T</span>
            </div>
            <span className="font-normal text-white text-micro tracking-apple-micro hidden sm:block">
              TOEFL Practice
            </span>
          </Link>

          {/* Right side - User */}
          <div className="flex items-center gap-4 user-menu-container">
            {isLoading ? (
              <div className="h-7 w-7 rounded-full bg-white/20 animate-pulse" />
            ) : currentUser ? (
              <div className="relative">
                {/* Avatar Button */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-micro text-white font-normal hidden sm:block group-hover:text-apple-link-bright transition-colors">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                    "bg-white/20 group-hover:bg-white/30",
                    isMenuOpen && "bg-white/40"
                  )}>
                    {currentUser.role === "teacher" ? (
                      <GraduationCap className="h-4 w-4 text-white" />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-apple-sm bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{currentUser.name}</p>
                      <p className="text-xs text-white/60 mt-0.5">{currentUser.email}</p>
                      <p className="text-xs text-apple-blue mt-1 capitalize">{currentUser.role}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Go to Dashboard */}
                      <Link 
                        href={homeLink}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>

                      {/* Divider */}
                      <div className="my-1 border-t border-white/10" />

                      {/* Sign Out */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                  <User className="h-4 w-4 text-white/60" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
