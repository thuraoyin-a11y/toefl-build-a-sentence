"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

/**
 * Container component props
 */
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "full" | "apple";
}

/**
 * Apple Design System Container Component
 * 
 * Container in Apple's system:
 * - Max content width: approximately 980px
 * - Full-viewport-width sections with centered content block
 * - Generous horizontal padding
 * - No visible grid lines or gutters — spacing creates implied structure
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "md", children, ...props }, ref) => {
    // Apple Design System - Container sizes
    // Apple standard: ~980px max-width
    const sizeStyles: Record<string, string> = {
      sm: "max-w-xl",
      md: "max-w-content", // 720px
      lg: "max-w-4xl",
      full: "max-w-none",
      apple: "max-w-apple", // 980px - Apple's standard
    };

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full px-4 sm:px-6 lg:px-8",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";
