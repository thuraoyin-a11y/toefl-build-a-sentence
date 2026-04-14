"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

/**
 * Badge variant types
 * Apple Design System: Subtle, rounded pills for status indicators
 * All text uses SF Pro Text with negative letter-spacing
 */
export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "neutral";

/**
 * Badge size types
 */
export type BadgeSize = "sm" | "md";

/**
 * Badge component props
 */
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

/**
 * Apple Design System Badge Component
 * 
 * Badges in Apple's system:
 * - Subtle, rounded-full pills
 * - Background colors are desaturated versions of the accent
 * - Text uses SF Pro Text with tight letter-spacing
 * - No borders
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", children, ...props }, ref) => {
    // Base styles - Apple badges are pill-shaped with subtle backgrounds
    const baseStyles =
      "inline-flex items-center font-normal rounded-full transition-colors";

    // Apple Design System - Badge variants (subtle backgrounds)
    const variantStyles: Record<BadgeVariant, string> = {
      // Default: Light gray background
      default: "bg-apple-gray text-apple-text",
      // Primary: Subtle blue tint
      primary: "bg-apple-blue/10 text-apple-blue",
      // Success: Subtle green tint
      success: "bg-apple-success/10 text-apple-success",
      // Warning: Subtle orange tint
      warning: "bg-apple-warning/10 text-apple-warning",
      // Neutral: Light gray
      neutral: "bg-gray-100 text-apple-text-secondary",
    };

    // Apple Design System - Badge sizes
    // Small: 12px micro text
    // Medium: 14px caption text
    const sizeStyles: Record<BadgeSize, string> = {
      sm: "px-2.5 py-0.5 text-micro tracking-apple-micro",
      md: "px-3 py-1 text-caption tracking-apple-caption",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
