---
name: Authority Control
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#8f6f6c'
  outline-variant: '#e4beba'
  surface-tint: '#ba1b20'
  primary: '#86000d'
  on-primary: '#ffffff'
  primary-container: '#af101a'
  on-primary-container: '#ffbdb7'
  inverse-primary: '#ffb3ac'
  secondary: '#5f5e5f'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe0'
  on-secondary-container: '#636263'
  tertiary: '#00436e'
  on-tertiary: '#ffffff'
  tertiary-container: '#005b94'
  on-tertiary-container: '#a9d1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#e5e2e3'
  secondary-fixed-dim: '#c8c6c7'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474647'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#9acbff'
  on-tertiary-fixed: '#001d34'
  on-tertiary-fixed-variant: '#004a79'
  background: '#faf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
  status-critical: '#AF101A'
  status-warning: '#FFBF00'
  status-alert: '#FF8C00'
  status-info: '#1182CE'
  status-success: '#15A654'
  deep-charcoal: '#1A1A1B'
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
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Outfit
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1440px
---

## Brand & Style

This design system is engineered for high-stakes administrative oversight, blending the traditional prestige of academic excellence with the technical "master-controller" efficiency of modern facility management software. The aesthetic is defined as **Technical Minimalism**: a white-canvas-heavy environment that prioritizes data density, clarity, and rapid decision-making.

The brand personality is authoritative, precise, and uncompromising. By utilizing a "super admin" perspective, the UI minimizes decorative elements in favor of functional hierarchy. The emotional response should be one of total control and absolute clarity, achieved through heavy whitespace, sharp geometric typography, and high-contrast status signaling.

## Colors

The palette is anchored by **Crimson Red**, used sparingly as a primary accent for high-priority actions and brand identification. The core text and structural elements utilize **Deep Charcoal** (#1A1A1B) rather than pure black to maintain a sophisticated, technical feel.

The background is a "white canvas" (#FFFFFF), occasionally broken by subtle neutral fills (#F7F6F3) to define data zones. Status badges are the primary source of color on the dashboard, utilizing high-contrast tones (Amber, Orange, Cobalt, Emerald, and Solid Red) to ensure immediate cognitive recognition of system health and urgent tasks.

## Typography

**Outfit** is the sole typeface, chosen for its geometric precision and modern architectural feel. The hierarchy is strictly enforced through weight and letter spacing. 

Headlines utilize tighter tracking and heavier weights to project authority. Labels and "Super Admin" metadata use uppercase styling with increased letter spacing to differentiate technical data from standard prose. Body text remains clean and highly legible, optimized for reading long-form academic reports or dense audit logs.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop, centered on a 1440px canvas to ensure consistent data density. A 12-column system is used with 24px gutters.

The spacing rhythm is based on a 4px baseline. Large margins (48px) on desktop create the "white-canvas" aesthetic, isolating functional modules to reduce cognitive load. On mobile, the margins compress to 16px, and the grid collapses to a single column while maintaining the 24px vertical rhythm between modules.

## Elevation & Depth

To maintain the "Technical Master-Controller" feel, this design system avoids soft, ambient shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

Depth is communicated through:
- **Surface Tiering**: Primary content sits on the pure white (#FFFFFF) background. Secondary panels or sidebars use a subtle neutral fill (#F7F6F3).
- **Ghost Borders**: Elements like cards and inputs are defined by 1px solid borders in a light gray (#E0E0E0) rather than shadows.
- **Active State Elevation**: Only the most critical interactive elements (like the primary action button) may use a sharp, 2px "hard" shadow to indicate focus, reinforcing the tactile nature of a control panel.

## Shapes

The design system uses a consistent **12px (0.75rem)** corner radius for all primary UI elements, including cards, buttons, and input fields. This specific radius strikes a balance between the rigid "technical" feel and the modern "premium" aesthetic.

Status badges and tags use a "semi-pill" shape (6px radius) to differentiate them from functional containers, ensuring they stand out as informative indicators within the geometric layout.

## Components

### Buttons
- **Primary**: Solid Crimson Red (#AF101A) with White text. Bold, 12px rounded corners.
- **Secondary**: Deep Charcoal (#1A1A1B) outline or solid.
- **Technical**: Ghost buttons with subtle borders for low-priority admin actions.

### Status Badges
High-contrast indicators are essential. They must feature a solid color background with high-contrast text (White or Deep Charcoal depending on the hue) to ensure immediate visibility. Use the `named_colors` for specific statuses.

### Input Fields
Clean, 12px rounded borders with a 1px solid stroke. Focus states should transition the border color to Crimson Red. Labels must use the `label-md` typographic style, placed strictly above the field.

### Cards
White background, 1px light gray border, 12px radius. No shadows. Use internal padding of 24px to maintain the "white-canvas" feel.

### Lists & Tables
Heavy reliance on tabular data. Row separators should be 1px light gray strokes. Header rows must use the `label-sm` style for a technical, spreadsheet-like precision.

### Admin Dashboard Rails
A slim, vertical navigation rail in Deep Charcoal (#1A1A1B) with high-contrast icons provides the "master-controller" navigation, ensuring the main canvas remains dedicated to data and tools.