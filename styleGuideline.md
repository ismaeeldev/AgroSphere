# AgroSphere Premium SaaS Style Guideline

This document serves as the single source of truth for the visual identity, UI components, and animation behavior of the AgroSphere Landing Page. This ensures perfect consistency for future page expansions or feature additions.

## 1. Color Palette

AgroSphere utilizes an earthy, agriculture-inspired palette elevated by high-contrast premium SaaS gradients.

### Core Colors
- **Deep Agriculture Green (Primary Backgrounds / Footers)**
  - Hex: `#1B5E20`
  - Usage: Heavy contrast sections (Global Trust, AI Chatbot). It grounds the design.
- **Fresh Leaf Green (Accents / CTAs / Highlights)**
  - Hex: `#4CAF50`
  - Usage: Primary buttons, badges, glowing accents, and trailing words in headings.
- **Golden Wheat (Premium Accents)**
  - Hex: `#C9A227` (or Tailwind `yellow-500`)
  - Usage: Star ratings, special icons, and trust markers.

### Background & Surface Tones
- **Main Background**: Pure White (`#FFFFFF`) or off-white (`bg-zinc-50`).
- **Glow Backgrounds**: `bg-gradient-to-br from-green-100 to-green-50`.
- **Dark Glass Surface**: `bg-white/5 backdrop-blur-xl border border-white/10`.
- **Light Glass Surface**: `bg-white/70 backdrop-blur-xl border border-white/40`.

## 2. Typography

We prioritize incredibly bold, striking typography to emulate top-tier tech presentation landing pages (e.g., Apple, Stripe).

- **Typeface**: `"Segoe UI", sans-serif`.
- **Section Headers (H2/H1)**: 
  - Weight: Extremely Bold (`font-weight: 800`)
  - Tracking: `tracking-tight`
  - Leading: `leading-[1.1]`
  - Layout: First half `text-black` (or `text-white` on dark backgrounds), trailing keyword `span` wrapped in `text-[#4CAF50]`.
- **Subheaders & Labels**:
  - Usually uppercase with `tracking-widest` to create technical/premium contrast.
  - Text color: `text-foreground/70` or `text-green-800/70`.

## 3. Component Architecture & Shapes

AgroSphere entirely rejects sharp corners in favor of highly rounded, smooth borders that imply modern safety and biotechnology.

- **Primary Cards (Products, Why Choose)**: 
  - Border Radius: `rounded-2xl`
  - Internal Padding: `p-6` to `p-8`
- **Giant Layout Blocks (Stack Cards, AI Chatbot)**: 
  - Border Radius: `rounded-3xl` or `rounded-[40px]`.
- **Buttons & Badges**: 
  - Exclusively `rounded-full`.
  - Badges use translucent backgrounds: `bg-green-500/20 text-green-300 border border-green-400/30`.

## 4. Depth & Lighting (Shadows)

The "SaaS feel" is achieved entirely through lighting, drop-shadows, and background blurs. Flat design is largely avoided on cards.

- **Interaction Shadows**: Standard cards hover into `shadow-2xl`.
- **Z-Space Shadows (Layout Stacking)**: Elements floating on top of others (like glass panels or stacked scroll cards) cast deep, massive tinted shadows:
  - Example: `shadow-[0_-30px_80px_rgba(0,0,0,0.15)]` (Casts shadow *upwards* for entering cards).
- **Background Orbs**: To prevent dark backgrounds from looking flat, absolute radial gradient colored blurs are placed behind glassmorphism elements:
  - `bg-[radial-gradient(circle...)] opacity-60`
  - `bg-green-500/20 rounded-full blur-3xl`

## 5. Animation & Physics (Framer Motion)

Animations are central to AgroSphere. They use real-world mass and spring physics to eliminate "snappy" UI jank.

### Scroll Reveal (General Content)
- All main contents fade UP into view recursively using the `useScrollReveal` hook.
- Parameters: `y: 40 -> 0`, `opacity: 0 -> 1`, `duration: 0.5`, `easeOut`.

### Hover States (Micro-interactions)
- **Cards**: `hover:-translate-y-2 hover:scale-102 hover:shadow-2xl`
- **Images**: Combine `overflow-hidden` container with `transition-transform duration-500 group-hover:scale-110`.
- **Buttons**: The text stays still, but the *icon* moves (`group-hover:translate-x-1` or `group-hover:scale-110`).

### The Scroll Stack (Macro-layout)
The core feature of the page is the `ScrollStack` engine. 
When building new sections inside it, adhere to its strict phase logic:
- **Physics**: Governed by `useSpring` (`stiffness: 250, damping: 35, mass: 1.2`).
- **Layers**: Covered items must drop brightness (`0.4`), blur out (`blur(16px)`), scale down (`0.90`), and parallax sink (`-10vh`).

## 6. Layout Structural Rhythms
- **Section Spacing**: Universal `.section-padding` (`py-20`, `py-24`, or `py-16` for tighter bounds like AI Chatbot).
- **Containers**: Always wrapped in `<Container>` to enforce `max-w-7xl` consistency.
