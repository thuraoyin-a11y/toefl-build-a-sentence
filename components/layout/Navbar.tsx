"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Container } from "./Container";
import { useUserStore } from "@/store/userStore";
import { User, GraduationCap } from "lucide-react";

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
  const { currentUser, isLoading, fetchUser } = useUserStore();

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-7 w-7 rounded-full bg-white/20 animate-pulse" />
            ) : currentUser ? (
              <Link 
                href={homeLink}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <div className="flex flex-col items-end">
                  <span className="text-micro text-white font-normal hidden sm:block group-hover:text-apple-link-bright transition-colors">
                    {currentUser.name}
                  </span>
                </div>
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                  "bg-white/20 group-hover:bg-white/30"
                )}>
                  {currentUser.role === "teacher" ? (
                    <GraduationCap className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
              </Link>
            ) : (
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-4 w-4 text-white/60" />
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
