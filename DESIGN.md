---
name: Precision MDM Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#545f72'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f7'
  on-secondary-container: '#586377'
  tertiary: '#3a1100'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c2000'
  on-tertiary-container: '#ff7022'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#d8e3fa'
  secondary-fixed-dim: '#bcc7dd'
  on-secondary-fixed: '#111c2c'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 24px
  gutter-grid: 16px
  padding-table-cell: 8px 12px
  density-high: 4px
  density-comfortable: 12px
---

## Brand & Style
The design system is engineered for the high-stakes environment of R&D data management. It embodies a **Corporate/Modern** aesthetic with a strong emphasis on **Precision** and **Efficiency**. The brand personality is professional and systematic, prioritizing data density and clarity over decorative elements.

The UI evokes a sense of reliability and technical mastery through a structured grid, high-contrast typography, and a deliberate use of corporate accents. The interface is designed for expert users who require rapid information processing and error-free data entry, balancing a high-tech atmosphere with institutional stability.

## Colors
This design system utilizes a high-contrast palette optimized for long-duration focus.
- **Primary (Deep Navy):** Used for structural elements like side navigation and primary headers to establish authority and trust.
- **Secondary (Slate Grey):** Applied to secondary metadata, supporting text, and inactive states to reduce visual noise.
- **Accent (Vibrant Orange):** Reserved strictly for primary calls to action, critical alerts, or highlighting active states in data visualization.
- **Neutral (Slate White/Grey):** The canvas is a series of light greys (`#F8FAFC`, `#F1F5F9`) to define container boundaries without the harshness of pure white, reducing eye strain in data-heavy views.

## Typography
The typography system is bifurcated to handle both branding and utility. **Hanken Grotesk** provides a modern, sharp edge to headlines and section titles. **Noto Sans** is the workhorse for all data entry and reading, chosen for its exceptional legibility in multilingual R&D contexts. 

**JetBrains Mono** is introduced for "Labels" and "Technical IDs"—such as Part Numbers or SKU codes—to ensure that similar characters (0/O, 1/l) are easily distinguishable during high-speed data auditing.

## Layout & Spacing
The design system employs a **Fixed-Fluid Hybrid Grid**. The side navigation is fixed at 240px to provide a persistent anchor, while the content area utilizes a fluid 12-column grid.

Spacing follows a strict **4px baseline shift**. For MDM interfaces, use "High-Density" spacing (4px-8px) for data tables and form groups to maximize information above the fold. Use "Comfortable" spacing (12px-24px) for dashboard layouts and landing pages to provide visual breathing room. 

**Breakpoints:**
- Desktop (Default): 1440px+
- Laptop/Small Desktop: 1024px
- Tablet (Internal use): 768px (Side nav collapses to icon-only)

## Elevation & Depth
To maintain a professional, flat aesthetic while ensuring functional hierarchy, this design system uses **Tonal Layering** supplemented by **Micro-Shadows**.

- **Level 0 (Base):** `#F8FAFC` background.
- **Level 1 (Cards/Containers):** White background with a 1px border in `#E2E8F0`. No shadow.
- **Level 2 (Modals/Popovers):** White background with a subtle, tight shadow: `0px 4px 12px rgba(0, 51, 102, 0.08)`.
- **Active State:** Elements being edited receive a 1px inset border of the Primary Navy to indicate focus without shifting layout.

## Shapes
The shape language is "Soft-Technical." Elements use a **4px (0.25rem)** corner radius for standard components like buttons, inputs, and tags. This slight rounding softens the "brutal" nature of a data-dense layout while maintaining a crisp, architectural feel. Larger containers like modals use **8px (0.5rem)** to differentiate them from the primary grid.

## Components
- **Data Tables:** The core of the system. Headers must be sticky with a `#F1F5F9` background. Rows should feature a subtle hover state (`#F8FAFC`). Use mono-spaced labels for ID columns.
- **Search Filters:** Integrated horizontally above tables. Use "Tag-style" chips for active filters to allow quick removal.
- **Buttons:** 
    - *Primary:* Solid Deep Navy with white text.
    - *Secondary:* Ghost style with Slate Grey border.
    - *Action:* Vibrant Orange used only for "Submit," "Publish," or "New Entry."
- **Side Navigation:** Deep Navy background. Active items use a vertical 4px Orange stripe on the left edge and a slight opacity increase for the text.
- **Status Indicators:** Use small, high-saturation circular dots (Green for Valid, Orange for Pending, Red for Error) alongside the technical labels.
- **Input Fields:** Flat design with a 1px light grey border. Upon focus, the border transitions to Primary Navy with a 2px outer glow of 10% opacity Navy.