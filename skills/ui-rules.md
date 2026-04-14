# UI Rules

## Design System
- Apple-style clean UI: rounded corners, soft shadows, SF Pro font stack.
- Tailwind tokens in `tailwind.config.ts` under `theme.extend.colors.apple`.

## Color Usage
- Primary actions: `bg-apple-blue`, `hover:bg-apple-blue-hover`.
- Success: `text-apple-success`.
- Warning: `text-apple-warning` / `bg-orange-500` for retry buttons.
- Text: `text-apple-text` (primary), `text-apple-text-secondary` (secondary).
- Backgrounds: white or `bg-apple-gray`.

## Component Patterns
- Use existing `Card`, `Button`, `Badge` from `components/ui/`.
- Cards should use `shadow-apple` and `rounded-apple`.
- Buttons should be full-width inside cards when they are the primary CTA.

## Accessibility Baseline
- All interactive elements must have visible focus states.
- Use semantic HTML (`<button>`, `<a>`) — no divs as buttons.
- Icons inside buttons must have `aria-hidden` or be accompanied by text.
