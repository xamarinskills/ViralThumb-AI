# Theming System

## Overview
- Supports dark and light themes via `html` classes: `dark` and `light`.
- Theme preference persists in `localStorage` under key `theme`.
- System preference is detected via `prefers-color-scheme`.
- Smooth transitions for background, text, and border colors.

## How Theme Is Applied
- On startup, a script in `index.html` sets `html` class to `dark` or `light`.
- In app, the Settings page Dark Mode toggle updates the theme and `localStorage`.
- Light theme overrides key Tailwind token classes using CSS selectors like `html.light .bg-background`.

## Add New Theme Variants
1. Create a class on `html` (e.g., `solarized`).
2. Add CSS overrides in `index.html` for token classes:
   - `.bg-background`, `.bg-surface`, `.text-text-secondary`, `.border-white/5`, `.bg-white/5`
3. Update the Settings toggle to set the new class on `document.documentElement` and persist it in `localStorage`.

## Extend the Theming System
- Prefer token classes (`bg-background`, `bg-surface`, `text-text-secondary`) over hard-coded colors.
- Add new token classes to Tailwind config in `index.html` under `tailwind.config.theme.extend.colors`.
- Provide matching light theme overrides in the CSS.

## Override Default Theme Values
- For quick overrides, add more specific CSS rules under `html.dark` or `html.light`.
- Example:
  - `html.light .text-white { color: #0f172a !important; }`
  - `html.dark .text-text-secondary { color: #ab9cba !important; }`

## Accessibility
- Contrast ratios for light theme:
  - Background: `#f8fafc`, surface: `#ffffff`, text: `#0f172a`.
  - Secondary text: `#475569` on `#ffffff` (meets WCAG AA).
- Dark Mode toggle uses `role="switch"` and `aria-checked`.

## Testing Checklist
- Verify theme persists after refresh.
- Confirm system preference influences initial theme.
- Check contrast with a WCAG tool (AA minimum).
- Validate responsive layouts in both themes.
- Inspect key components: Navbar, Cards, Buttons, Inputs, Settings.

