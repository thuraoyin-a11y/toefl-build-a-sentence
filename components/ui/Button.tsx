"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

/**
 * Button variant types
 * Following Apple Design System:
 * - primary: Apple Blue (#0071e3) background, white text
 * - secondary: Blue background, white text
 * - pill: Transparent with Apple Link color, pill-shaped (980px radius)
 * - ghost: Transparent, text only with hover
 */
export type ButtonVariant = "primary" | "secondary" | "pill" | "ghost";

/**
 * Button size types
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button props interface
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Apple Design System Button Component
 * 
 * Primary (CTA): Apple Blue background (#0071e3), white text, 8px radius
 * Secondary: Blue background, white text, 8px radius
 * Pill: Transparent, Apple Link color (#0066cc), 980px radius (pill shape)
 * Ghost: Transparent, text only with subtle hover background
 * 
 * All buttons use SF Pro Text, 17px, weight 400 (or 18px weight 300 for large)
 * Padding: 8px 15px standard
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles - Apple buttons have tight line-height (2.41) for button text
    const baseStyles =
      "inline-flex items-center justify-center font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    // Apple Design System - Button variants
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary CTA: Apple Blue (#0071e3), white text, 8px radius
      primary:
        "bg-apple-blue text-white hover:bg-apple-blue-hover rounded-apple border border-transparent",
      // Secondary: Blue background, white text, 8px radius
      secondary:
        "bg-apple-blue text-white hover:bg-apple-blue-hover rounded-apple border border-transparent",
      // Pill: Transparent, Apple Link color, 980px radius
      pill:
        "bg-transparent text-apple-link hover:underline rounded-apple-pill border border-apple-link",
      // Ghost: Transparent, text color, subtle hover
      ghost:
        "bg-transparent text-apple-link hover:bg-apple-blue/5 rounded-apple border border-transparent",
    };

    // Apple Design System - Button sizes
    // Standard: 17px, weight 400, line-height 2.41, padding 8px 15px
    // Large: 18px, weight 300, line-height 1.00
    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-sm leading-apple-body tracking-apple-body",
      md: "px-[15px] py-2 text-button leading-apple-relaxed tracking-normal",
      lg: "px-5 py-2.5 text-button-lg leading-apple-tight tracking-normal",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
