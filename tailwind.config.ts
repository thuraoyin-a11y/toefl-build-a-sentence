import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple Design System - Primary (Blue-White Theme)
        "apple-gray": "#f5f5f7",
        "apple-gray-warm": "#e8f4fd",
        
        // Apple Design System - Interactive (Blue Theme)
        "apple-blue": "#0071e3",
        "apple-blue-hover": "#0077ed",
        "apple-blue-light": "#e8f4fd",
        "apple-blue-dark": "#005bb5",
        "apple-link": "#0066cc",
        "apple-link-bright": "#2997ff",
        
        // Apple Design System - Text (Blue-Gray instead of Black)
        "apple-white": "#ffffff",
        "apple-text": "#1e3a5f",
        "apple-text-secondary": "rgba(30, 58, 95, 0.7)",
        "apple-text-tertiary": "rgba(30, 58, 95, 0.45)",
        
        // Apple Design System - Light Blue Surfaces (replaced dark surfaces)
        "apple-dark-1": "#e8f4fd",
        "apple-dark-2": "#d4ebfc",
        "apple-dark-3": "#c0e1fb",
        "apple-dark-4": "#acd8fa",
        "apple-dark-5": "#98cef9",
        
        // Apple Design System - Button States
        "apple-button-active": "#dbeafe",
        "apple-button-light": "#fafafc",
        "apple-overlay": "rgba(0, 113, 227, 0.15)",
        
        // Legacy compatibility
        "apple-success": "#34c759",
        "apple-warning": "#ff9500",
        "apple-border": "#e5e5e7",
      },
      fontFamily: {
        // Apple Design System - Typography
        // SF Pro Display for 20px and above
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Icons"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        // SF Pro Text for below 20px
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Icons"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        // Combined sans-serif stack
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Apple Design System - Display Sizes
        "display-hero": ["56px", { lineHeight: "1.07", letterSpacing: "-0.28px", fontWeight: "600" }],
        "display-section": ["40px", { lineHeight: "1.10", letterSpacing: "0", fontWeight: "600" }],
        "display-tile": ["28px", { lineHeight: "1.14", letterSpacing: "0.196px", fontWeight: "400" }],
        "display-card": ["21px", { lineHeight: "1.19", letterSpacing: "0.231px", fontWeight: "700" }],
        "display-sub": ["21px", { lineHeight: "1.19", letterSpacing: "0.231px", fontWeight: "400" }],
        
        // Apple Design System - Text Sizes
        "nav-heading": ["34px", { lineHeight: "1.47", letterSpacing: "-0.374px", fontWeight: "600" }],
        "nav-sub": ["24px", { lineHeight: "1.50", letterSpacing: "0", fontWeight: "300" }],
        "body": ["17px", { lineHeight: "1.47", letterSpacing: "-0.374px", fontWeight: "400" }],
        "body-emphasis": ["17px", { lineHeight: "1.24", letterSpacing: "-0.374px", fontWeight: "600" }],
        "button-lg": ["18px", { lineHeight: "1.00", letterSpacing: "0", fontWeight: "300" }],
        "button": ["17px", { lineHeight: "2.41", letterSpacing: "0", fontWeight: "400" }],
        "link": ["14px", { lineHeight: "1.43", letterSpacing: "-0.224px", fontWeight: "400" }],
        "caption": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px", fontWeight: "400" }],
        "caption-bold": ["14px", { lineHeight: "1.29", letterSpacing: "-0.224px", fontWeight: "600" }],
        "micro": ["12px", { lineHeight: "1.33", letterSpacing: "-0.12px", fontWeight: "400" }],
        "micro-bold": ["12px", { lineHeight: "1.33", letterSpacing: "-0.12px", fontWeight: "600" }],
        "nano": ["10px", { lineHeight: "1.47", letterSpacing: "-0.08px", fontWeight: "400" }],
      },
      borderRadius: {
        // Apple Design System - Border Radius Scale
        "apple-micro": "5px",
        "apple": "8px",
        "apple-comfortable": "11px",
        "apple-lg": "12px",
        "apple-pill": "980px",
      },
      boxShadow: {
        // Apple Design System - Subtle shadows
        "apple-card": "rgba(0, 0, 0, 0.22) 3px 5px 30px 0px",
        "apple-sm": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "apple": "0 2px 8px rgba(0, 0, 0, 0.06)",
        "apple-lg": "0 4px 16px rgba(0, 0, 0, 0.08)",
      },
      spacing: {
        // Apple Design System - Dense spacing scale
        "apple-2": "2px",
        "apple-4": "4px",
        "apple-5": "5px",
        "apple-6": "6px",
        "apple-7": "7px",
        "apple-8": "8px",
        "apple-9": "9px",
        "apple-10": "10px",
        "apple-11": "11px",
        "apple-14": "14px",
        "apple-15": "15px",
        "apple-17": "17px",
        "apple-20": "20px",
        "apple-24": "24px",
      },
      maxWidth: {
        "apple": "980px",
        "content": "720px",
      },
      letterSpacing: {
        // Apple Design System - Negative tracking
        "apple-tight": "-0.28px",
        "apple-body": "-0.374px",
        "apple-caption": "-0.224px",
        "apple-micro": "-0.12px",
        "apple-nano": "-0.08px",
      },
      lineHeight: {
        // Apple Design System - Tight line heights
        "apple-hero": "1.07",
        "apple-tight": "1.10",
        "apple-card": "1.14",
        "apple-sub": "1.19",
        "apple-body": "1.47",
        "apple-relaxed": "2.41",
      },
      backdropBlur: {
        "apple": "20px",
      },
      saturate: {
        "apple": "180%",
      },
    },
  },
  plugins: [],
};

export default config;
