# AgroSphere App Guideline (Premium + Consistent)

Last updated: 2026-04-24

This is the implementation guide for developers building AgroSphere experiences from this project. It is now aligned with the current codebase and focused on one goal:

Build a premium agritech product with consistent visual language, motion behavior, and feature parity.

## 1. Product Intent

AgroSphere is a premium agritech platform that combines:

1. Crop protection commerce
2. AI-assisted crop diagnosis
3. Nearby expert assistance

Design personality:

1. Trustworthy and scientific (not flashy-gimmicky)
2. Modern and optimistic (green energy, clean surfaces)
3. Premium depth (glass, glow, soft shadows, rich spacing)

## 2. Source of Truth and Scope

This guideline is based on current implementation in this repository.

Core routes currently implemented:

1. `/` (landing with stacked sections)
2. `/products` (search/filter/pagination catalog)
3. `/products/[id]` (immersive product detail story page)
4. `/cart` (smart plan/cart UX)
5. `/nearby-help` (map + experts + bottom sheet)
6. `/field-officers/[id]` (expert profile)
7. `/login`
8. `/signup`

Global modules:

1. Global navbar/footer shell
2. Floating chatbot widget (chat + scan mode)
3. Cart context with role/strength tags

## 3. Premium Theme System

### 3.1 Color System

Primary brand colors:

1. Deep Green: `#1B5E20` (trust, headers, dark sections, strong CTA base)
2. Leaf Green: `#4CAF50` (action accent, active states, success emphasis)
3. Golden Wheat: `#C9A227` (ratings, premium trust highlights)

Neutrals:

1. Primary light background: white or zinc-50 style surface
2. Surface cards: white with soft zinc border
3. Muted text: zinc-500 to zinc-600 range

Usage rules:

1. Every major heading should include one highlighted phrase in Leaf Green.
2. Do not introduce unrelated accent families unless semantically required.
3. Keep primary CTAs green-gradient or deep-green filled.
4. Use yellow only for rating/trust-style meaning, not generic buttons.

### 3.2 Typography System

Current code uses Geist/Inter globally plus many section-level "Segoe UI" overrides.

Standard moving forward:

1. Display/headings: `Segoe UI`, fallback `var(--font-geist-sans)`, sans-serif
2. Body/UI copy: `var(--font-geist-sans)` or `var(--font-inter)`

Type rules:

1. Headings: bold to extra-bold (`700` to `800`), tight tracking.
2. Section labels: uppercase + tracking-wide/widest.
3. Body copy: medium contrast, readable line-height, avoid over-light weights.

### 3.3 Radius, Borders, and Shapes

No sharp corners.

1. Cards: `rounded-2xl` to `rounded-3xl`
2. Feature/story panels: up to `rounded-[32px]` or `rounded-[40px]`
3. Buttons/chips/FABs: predominantly pill-style (`rounded-full`)
4. Bottom sheets: very rounded top corners

### 3.4 Depth and Surface Treatment

Premium depth is mandatory:

1. Use soft shadows with green tint where relevant.
2. Use glassmorphism only where meaningful (chat panels, auth cards, overlays).
3. Use atmospheric gradients/orbs for section mood.
4. Avoid flat, unlayered blocks in hero and featured areas.

## 4. Motion Language (Must Stay Consistent)

Framework baseline: Framer Motion spring-oriented interactions.

Key behaviors:

1. Scroll reveal pattern: `opacity 0 -> 1`, `y 20-40 -> 0`.
2. Hover micro-interaction: small lift/scale (`~1.02 to 1.05`) with shadow growth.
3. Mode/panel transitions: subtle directional slide + fade + blur.
4. Floating accents: low-amplitude infinite drift for premium liveliness.

Signature experience:

1. ScrollStack section engine with layered depth behavior.
2. Covered cards must scale down, blur, and darken.
3. Never replace this with abrupt section jumps for premium pages.

## 5. Layout and Spacing Rhythm

1. Use `Container` wrapper for horizontal consistency.
2. Use `.section-padding` for primary vertical rhythm.
3. Major sections should breathe (large top/bottom spacing).
4. Keep mobile-first stacking and avoid cramped card density.

## 6. Feature Inventory and UX Standards

### 6.1 Landing Experience (`/`)

Includes:

1. Hero with layered atmosphere and trust stats
2. ScrollStack sequence:
3. `Categories` (anchor id `categories`)
4. `Products` preview (anchor id `products`)
5. `WhyChoose`
6. Additional sections: `CropSolutions`, `Testimonials`, `ChatFAQ`, `Newsletter`, `Contact`

Rules:

1. If adding new homepage section, decide if it belongs inside ScrollStack or normal flow.
2. Maintain premium transitions and visual continuity between light/dark-ish blocks.

### 6.2 Product Catalog (`/products`)

Includes:

1. Search expansion interaction
2. Dynamic category chips + high-rated filter
3. Paginated product grid
4. Empty-state UX with recovery action

Rules:

1. Filtering must feel instant.
2. Card hover should preserve product readability.
3. Keep CTA hierarchy clear: product detail first, cart action secondary.

### 6.3 Product Detail (`/products/[id]`)

Includes:

1. Immersive hero with floating product visual
2. Story sequence (problem -> solution)
3. Benefits grid
4. Recovery timeline
5. Reviews + review submission state
6. Mobile sticky CTA

Rules:

1. Keep storytelling progression clear and scannable.
2. Product CTA must stay visible and high-contrast.
3. Review interactions should feel responsive and delightful.

### 6.4 Cart / Protection Plan (`/cart`)

Includes:

1. Smart plan title generated from cart role mix
2. Item cards + recommendation strip + summary
3. Rich empty-state CTA

Rules:

1. Plan framing should remain aspirational (strategy/protection language).
2. Summary block should stay sticky on desktop.
3. Cart actions must update badge counts and totals immediately.

### 6.5 Nearby Help (`/nearby-help`)

Includes:

1. Location permission experience
2. Fallback geolocation handling
3. Dynamic expert distance calculation
4. Leaflet map with custom markers
5. Bottom sheet expert actions

Rules:

1. Permission flow must be clear and non-blocking.
2. Expert nearest/active state should be visually obvious.
3. Bottom sheet and map camera movement must feel coordinated.

### 6.6 Field Officer Profile (`/field-officers/[id]`)

Includes:

1. Profile hero with availability signal
2. Trust metrics + specialization chips
3. WhatsApp and contact actions
4. Large support CTA block

Rules:

1. Emphasize trust and verification.
2. Keep contact actions always discoverable.

### 6.7 Auth (`/login`, `/signup`)

Includes:

1. Split-panel premium auth layout
2. Glass card with motion states
3. Loading/success interactions

Rules:

1. Auth pages intentionally hide global nav/footer.
2. Keep interaction feedback immediate (focus, submit, success).

### 6.8 AI Chatbot Widget (Global)

Includes:

1. Floating smart FAB with hint switching
2. Chat mode (FAQ-like intelligence + scan context)
3. Scan mode (upload/camera mock flow + staged analysis)
4. Context handoff from scan to chat

Rules:

1. Widget must remain available globally (except if future product decision says otherwise).
2. Chat and scan are equal modes; do not bury one.
3. Use smooth mode transitions, not hard switch.

## 7. Data and Behavior Reality (Important for Developers)

Current implementation includes demo/mock behavior in places.

1. Auth submits are simulated.
2. Chatbot responses are keyword/mock driven.
3. Scan analysis is simulated pipeline + mock result.
4. Cart initializes with demo items.

When integrating backend:

1. Keep UX states unchanged (loading, empty, success, error).
2. Preserve existing premium interaction and timing expectations.
3. Do not remove visual polish during API integration.

## 8. Accessibility and Quality Bar

Minimum standards:

1. Keyboard navigable interactive controls.
2. Visible focus states on all inputs/buttons.
3. Sufficient contrast for text over gradients/glass.
4. Alt text for meaningful imagery.
5. Proper heading hierarchy per page.

Performance standards:

1. Prefer GPU-friendly transforms for animation.
2. Avoid overusing heavy blur on low-end devices.
3. Keep map/chat overlays performant on mobile.

## 9. Component Reuse Rules

1. Reuse existing primitives in `components/ui` first.
2. Keep button, card, badge language consistent with existing variants.
3. New components must follow the same radius, spacing, and color logic.
4. Use existing hooks/utilities before introducing parallel patterns.

## 10. Consistency Checklist Before Merge

Every new feature/page must pass:

1. Uses brand greens correctly and consistently.
2. Has premium depth (not flat default blocks).
3. Matches motion style (spring-like, smooth, contextual).
4. Works on mobile and desktop breakpoints.
5. Includes proper empty/loading/error states.
6. Maintains navbar/footer and chatbot behavior expectations.
7. Does not break ScrollStack or section rhythm on homepage.

## 11. What to Avoid

1. Random new color accents disconnected from brand palette.
2. Sharp-cornered components in premium sections.
3. Abrupt/no-motion transitions for key interactions.
4. Mixing unrelated visual styles across pages.
5. Generic, plain layouts that remove brand character.

## 12. Final Handoff Note

If a developer is unsure between two design options, choose the one that is:

1. More consistent with existing AgroSphere pages
2. More premium in depth and motion
3. More readable and trustworthy for farmers

Consistency is a product feature in AgroSphere, not a cosmetic preference.
