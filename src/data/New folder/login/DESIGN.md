---
name: Academic Excellence Portal
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8f6f6c'
  outline-variant: '#e4beba'
  surface-tint: '#ba1b20'
  primary: '#86000d'
  on-primary: '#ffffff'
  primary-container: '#af101a'
  on-primary-container: '#ffbdb7'
  inverse-primary: '#ffb3ac'
  secondary: '#006d2f'
  on-secondary: '#ffffff'
  secondary-container: '#5dfd8a'
  on-secondary-container: '#007232'
  tertiary: '#5c3800'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c4d00'
  on-tertiary-container: '#ffc278'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#66ff8e'
  secondary-fixed-dim: '#3de273'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005322'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered for a premium, corporate-academic environment, balancing the heritage of a prestigious institution with the efficiency of modern technical management. The aesthetic is rooted in **Corporate Modernism** with subtle **Glassmorphic** accents to signify innovation. 

The target audience includes university administrators, facility managers, and students who require a dependable, high-performance interface. The UI evokes a sense of authority and precision through generous white space, structured grids, and a sophisticated interplay between deep crimson accents and clean, neutral surfaces. The emotional response is one of trust, clarity, and structural integrity.

## Colors
The palette is dominated by the institution's heritage Crimson Red, used strategically for primary actions, branding elements, and critical highlights. 

- **Primary Axis:** Crimson (#af101a) serves as the main interactive color, supported by darker shades for hover states and depth.
- **Surface Strategy:** The base environment uses a sleek light gray (#f7f7f7) to reduce eye strain, while active content modules and cards are housed in pure white containers to create clear visual separation.
- **Action & Status:** WhatsApp Green and Emerald are reserved for successful facility bookings and active status indicators. Amber Gold is utilized for "Pending" or "Maintenance" warnings, ensuring high visibility without the urgency of a red error state.

## Typography
This design system employs a dual-font strategy. **Outfit** is used for headlines to provide a modern, geometric clarity that feels contemporary and inviting. **Inter** is utilized for all body copy and UI labels due to its exceptional legibility in data-heavy academic tables and forms.

Large headlines should use tighter letter spacing to maintain a cohesive "block" feel. For mobile views, headline sizes are scaled down to ensure titles do not wrap excessively, maintaining the professional layout structure.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a max-width container for desktop viewing to preserve readability. 

- **Desktop (1280px+):** 12-column grid, 24px gutters, 40px side margins.
- **Tablet (768px - 1024px):** 8-column grid, 20px gutters, 24px side margins.
- **Mobile (<768px):** 4-column grid, 16px gutters, 16px side margins.

Vertical rhythm is strictly maintained using multiples of 8px. Use 24px (md) for standard component spacing and 40px (lg) for section separation to emphasize the "clean/airy" academic aesthetic.

## Elevation & Depth
Hierarchy is established through high-end ambient shadows and tonal layering. 

- **Surface Levels:** The background sits at Level 0 (#f7f7f7). Primary content cards sit at Level 1 (Pure White) with a soft shadow (0 25px 50px -12px rgba(0,0,0,0.08)).
- **Glassmorphism:** Navigation sidebars and modal overlays utilize a backdrop-blur (12px to 16px) with a semi-transparent white tint (rgba(255, 255, 255, 0.7)). This provides a technical "HUD" feel to the facilities management tools.
- **Interactive Depth:** Buttons should use a subtle 2px inner-shadow on press to simulate tactile feedback without appearing dated.

## Shapes
The shape language is consistently "Rounded" to soften the institutional nature of the platform.

- **Standard Elements:** Buttons, input fields, and small cards use a **12px** radius.
- **Large Containers:** Dashboard widgets and main content sections use a **16px** (rounded-lg) radius to create a distinct, modern framing.
- **Interactive Indicators:** Status pills and "New" badges use a full pill shape (999px) to distinguish them from structural square-ish containers.

## Components
- **Buttons:** Primary buttons use the Crimson Red (#af101a) with white text. Ghost buttons use a 1px border of the same red. Roundedness is fixed at 12px.
- **Input Fields:** Use a subtle light-gray fill (#f3f4f6) that transitions to pure white with a 2px Crimson border on focus. Labels should always be visible above the field in Inter (Label-md).
- **Cards:** White background, 16px corner radius, and the signature "soft high-end depth" shadow. Cards used for facility status should include a 4px left-border accent color (Green/Amber/Red) to denote state.
- **Chips/Badges:** Use low-saturation background tints of the status colors with high-saturation text (e.g., light emerald background with dark emerald text) for "Available" or "Booked" indicators.
- **Navigation:** The sidebar should utilize a frosted-glass effect with a blur, keeping the primary institution logo at the top left. Active links are indicated by a Crimson vertical bar and bolded text.
- **Data Tables:** Clean, no-border rows with subtle horizontal dividers. The header row should be slightly tinted (#f7f7f7) to anchor the data columns.