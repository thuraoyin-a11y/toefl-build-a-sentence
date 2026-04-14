"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

/**
 * Card component props
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "dark";
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Apple Design System Card Component
 * 
 * Cards in Apple's system:
 * - Background: #f5f5f7 (light) or #272729 (dark)
 * - Border: none (borders are rare in Apple's system)
 * - Radius: 8px-12px (standard)
 * - Shadow: Soft, diffused elevation (rgba(0, 0, 0, 0.22) 3px 5px 30px 0px) for elevated cards
 * - No hover states - cards are static, links within them are interactive
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = "default", padding = "md", children, ...props },
    ref
  ) => {
    // Base styles - Apple cards use f5f5f7 background typically
    const baseStyles = "rounded-apple-lg bg-apple-gray transition-shadow duration-200";

    // Apple Design System - Card variants
    const variantStyles: Record<string, string> = {
      // Default: Light gray background (#f5f5f7), no shadow
      default: "shadow-none",
      // Outlined: Rare in Apple design, subtle border if needed
      outlined: "shadow-none border border-apple-border/50 bg-white",
      // Elevated: Soft Apple card shadow
      elevated: "apple-card-shadow bg-white",
      // Dark: For dark sections
      dark: "bg-apple-dark-1 text-white shadow-none",
    };

    // Apple Design System - Padding scale
    const paddingStyles: Record<string, string> = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * Card header component
 * Apple style: generous spacing, tight typography
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mb-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

/**
 * Card title component
 * Apple style: SF Pro Display at 21px, weight 700 or 400
 */
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-display-sub text-apple-text tracking-normal",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

/**
 * Card description component
 * Apple style: SF Pro Text at 14px (caption), color rgba(0,0,0,0.8)
 */
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-caption text-apple-text-secondary mt-1", className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = "CardDescription";

/**
 * Card content component
 */
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

/**
 * Card footer component
 * Apple style: mt-6 flex items-center gap-3
 */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-6 flex items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";
