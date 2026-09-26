# AgroSphere Multi-Tenant Platform — Software Requirements Specification

**Version:** 4.0
**Status:** Approved architecture, hardened across ten audit passes — three foundational (technical, auth/redirect, business/compliance), pricing/feature-completeness, multi-tenant field-officer design, current-codebase migration-readiness, Marketing Site addition, flow-completeness/industry-technique, a final exhaustive module-by-module re-audit spanning all four systems, and a focused audit of the newest structural/tooling additions — plus a depth pass adding structured field tables for previously-thin modules, worked JSON examples per major entity ([0.9](#09-worked-examples)), an API contract reference for the highest-traffic endpoints ([5.23](#523-api-contract-reference)), explicit UI-state descriptions for the highest-traffic screens, a formal client-side state-management/forms decision (TanStack Query, Zustand, React Hook Form + Zod, see [0.2](#02-technology-stack)), a system-wide toast/notification policy ([5.24](#524-toast--notification-policy)) with full plan-limit-rejection coverage, a named Neon database provider with a manual (non-integration) Vercel environment-variable strategy ([5.25](#525-neon-database-provisioning--environment-strategy)), the remaining stack decisions closed out (next-intl, native nonce-based CSP, Playwright), a full production-grade folder structure with explicit separation-of-concerns rules and an existing-codebase migration map ([0.3a](#03a-full-project-folder-structure)–[0.3c](#03c-mapping-the-existing-codebase)), an explicit one-nav-one-footer-per-interface rule preventing per-page navigation/chrome duplication ([0.3d](#03d-layout-level-navigation--chrome--one-instance-per-interface-never-per-page)), and a mandatory shadcn-first UI policy with a required component-reuse checklist run before any new component is built ([0.3e](#03e-component-reuse--shadcn-first-policy)) — pre-implementation
**Stack:** Next.js 16 (App Router) · Prisma · PostgreSQL + pgvector

---

## Table of Contents

- [0. Overview](#0-overview)
  - [0.1 Scope](#01-scope)
  - [0.2 Technology Stack](#02-technology-stack)
  - [0.3 Architecture](#03-architecture)
    - [0.3a Full Project Folder Structure](#03a-full-project-folder-structure)
    - [0.3b Separation-of-Concerns Rules](#03b-separation-of-concerns-rules)
    - [0.3c Mapping the Existing Codebase](#03c-mapping-the-existing-codebase)
    - [0.3d Layout-Level Navigation & Chrome](#03d-layout-level-navigation--chrome--one-instance-per-interface-never-per-page)
    - [0.3e Component Reuse & shadcn-First Policy](#03e-component-reuse--shadcn-first-policy)
  - [0.4 Tenancy Model](#04-tenancy-model)
  - [0.5 Roles & Actors](#05-roles--actors)
  - [0.6 Core Data Model](#06-core-data-model)
  - [0.7 Data Isolation Policy](#07-data-isolation-policy)
  - [0.8 Localization & Currency](#08-localization--currency)
  - [0.9 Worked Examples](#09-worked-examples)
- [1. Marketing Site](#1-marketing-site)
- [2. Super Admin System](#2-super-admin-system)
- [3. Company Dashboard](#3-company-dashboard)
- [4. User-Side Storefront](#4-user-side-storefront)
- [5. Cross-Cutting Concerns](#5-cross-cutting-concerns)
- [6. End-to-End Flows](#6-end-to-end-flows)
- [7. Appendix](#7-appendix)

---

## 0. Overview

AgroSphere is being rebuilt from a single static, hardcoded Next.js storefront (mock data, no backend, no persistence) into a **true multi-tenant SaaS platform**. Each pesticide/agri-input company ("tenant") that signs up receives an isolated, fully brandable storefront on its own subdomain, a company dashboard to manage products, orders, finances, field agents, case studies, and AI knowledge, and its own Stripe Connect account to receive customer payments directly.

A platform owner (Super Admin) sits above every tenant, handling onboarding, billing between the platform and its tenant companies, platform-wide analytics, and global configuration.

This document specifies all four systems module-by-module, sub-module-by-sub-module, with data fields, routes, redirect/guard logic, and end-to-end user flows. **Version 2.0 additionally closes every gap surfaced by a three-pass adversarial audit** (technical/architecture, redirect/auth flow, business/compliance/operations) — each open question from that audit has been resolved here with a concrete decision, not left as a TODO. Where a decision trades off cost/complexity against risk, the reasoning is stated so it can be revisited later with full context. **Version 2.3 adds the Marketing Site as a fourth first-class system**, closing a gap where the platform's own root domain — the actual customer-acquisition surface for the whole business — had been left essentially unspecified.

### 0.1 Scope

This SRS covers four systems sharing one codebase:

1. **Marketing Site** — the public, unauthenticated root domain that sells the platform itself to prospective tenants: pricing, signup, demo, legal pages. The only system with no tenant context at all.
2. **Super Admin System** — the platform owner's control plane over all tenants.
3. **Company Dashboard** — each pesticide company's own admin panel.
4. **User-Side Storefront** — the public, customer-facing site (currently the only system that exists, as static mock data).

### 0.2 Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19 | Single all-in-one codebase — API routes replace the deleted NestJS backend entirely. |
| Database | **Neon** (managed PostgreSQL + `pgvector` extension), Row-Level Security enabled | Serverless-native Postgres with built-in branching (useful for the production-sized-snapshot migration testing already required in [0.7](#07-data-isolation-policy)) and a native connection pooler that removes the need to operate separate PgBouncer infrastructure. pgvector avoids standing up a separate vector DB for RAG; RLS is a required second layer of tenant isolation (see [0.7](#07-data-isolation-policy)), not optional hardening. |
| Connection pooling & provisioning | **Neon's native pooled connection endpoint** as `DATABASE_URL`, Neon's unpooled direct endpoint as `DIRECT_URL` (migrations only) — see [5.25](#525-neon-database-provisioning--environment-strategy) for the full setup | Neon's pooler is PgBouncer-compatible and built into the platform, so no separately-run PgBouncer is needed. Serverless functions on Vercel open a connection per cold invocation; the unpooled direct connection is reserved for `prisma migrate deploy` only, exactly as the original pooling requirement specified, now fulfilled by Neon's own infrastructure rather than self-hosted PgBouncer. |
| ORM | Prisma | Type-safe schema, migrations, works cleanly with Next.js route handlers. Vector columns and any tenant-scoped raw SQL follow the raw-query policy in [0.7](#07-data-isolation-policy). |
| Authentication | NextAuth (Auth.js), **database session strategy** | Handles multi-role, multi-tenant session/credential management. Database sessions (not pure JWT) are required so tenant suspension, plan downgrade, and staff role changes take effect immediately rather than at next token refresh — see [5.1.6](#516-session-freshness--revocation-policy). |
| Payments | Stripe Connect — Express accounts, destination charges | Each tenant onboards via Stripe-hosted flow and receives payouts directly to their own account. Platform liability for disputes/negative balances is explicitly modeled — see [5.2](#52-payments--stripe-connect-express). |
| Tax | Stripe Tax | Calculates tax at Checkout across tenant/farmer jurisdictions; remittance responsibility is contractually assigned — see [5.2.5](#525-tax-calculation--remittance). |
| File / image storage | Cloudinary, signed delivery for private assets | Product images, logos, case-study photography, diagnosis photo uploads, RAG source documents. Private assets (documents, diagnosis photos) use authenticated delivery, not public URLs — see [5.4](#54-file-storage--cloudinary). |
| Hosting | Vercel, platform DNS/nameservers | Native Next.js deployment target; wildcard subdomains require Vercel-managed nameservers for automatic SSL — see [5.9](#59-hosting--dns). |
| Background jobs | Inngest | Async document embedding (RAG), email sends, order webhooks, scheduled cost/anomaly checks — off the request/response path. |
| Email | Resend | Sandbox domain for local dev, verified domain in production. |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` (sliding window), server-checked for cost-capping | Edge-safe, distributed, keyed per tenant + user. Abuse throttling runs at the edge; hard per-tenant AI cost caps are reconciled against a centralized counter before the paid vendor call fires — see [5.6](#56-rate-limiting--upstash-redis). |
| Caching | Upstash Redis (tenant resolution), Next.js `revalidateTag` (CMS content) | Tenant resolution happens on every request; both must be cached to avoid a DB round-trip per request — see [5.10](#510-caching-strategy). |
| Observability | Sentry (error tracking), structured JSON logging, status page | Non-negotiable for a production multi-tenant SaaS handling payments and PII — see [5.11](#511-observability--monitoring). |
| Backup / DR | Postgres PITR (WAL archiving) + scheduled logical backups to object storage | See [5.12](#512-backup--disaster-recovery). |
| Text AI (RAG) | OpenAI (embeddings + chat completion), isolated behind an internal interface | Grounded answers from each tenant's uploaded documents. Vendor calls isolated in `lib/rag.ts` so a second provider can be added without a rewrite — see [5.13](#513-ai-vendor-abstraction--liability). |
| Image diagnosis AI | Kindwise `crop.health` API, isolated behind an internal interface, mandatory disclaimer + confidence floor | Self-serve, 23 crops / 288 diseases, field-photo trained, used for both MVP and production. See [5.13](#513-ai-vendor-abstraction--liability) and [4.9](#49-disease-diagnosis). |
| Maps | Leaflet / React-Leaflet | Already used for Nearby Help and Field Mapping; retained as-is. |
| Localization | **next-intl** (decided, not hedged), multi-currency display via Stripe presentment currency | Purpose-built for the App Router (Server Components support, stable `useTranslations`/`getTranslations` API, per-locale routing), the most widely adopted i18n library in the current Next.js ecosystem — next-i18next predates App Router and doesn't fit this project's architecture, and Paraglide's ecosystem is too small to prefer over next-intl here. Target market is emerging-market-heavy agriculture; treated as an MVP requirement, not a fast-follow — see [0.8](#08-localization--currency). |
| Security headers (CSP) | **Next.js's native nonce-based CSP** (generated in `middleware.ts`, per the framework's own documented pattern) — not `next-safe`, not a static-only `headers()` policy | Chosen specifically as the most stable option in the Next.js ecosystem: this is maintained by the Next.js core team as a first-class framework pattern, not a third-party package that can drift from framework changes. This project's `middleware.ts` already runs on every request for subdomain/tenant resolution ([5.1](#51-redirect--guard-logic)) — nonce generation is added to that same middleware pass, no new architectural surface introduced. Nonce-based CSP is materially stronger than a static allowlist for this platform's actual threat model, since it blocks injected inline scripts from tenant/farmer-controlled content (CMS section text, case studies, product descriptions, chatbot responses, reviews) even where a static policy alone would need to disable inline scripts entirely to be effective. The policy separately allowlists this project's genuine client-loaded third parties (Stripe.js for Checkout, Cloudinary for images, Leaflet's map tiles) alongside the nonce mechanism. |
| Testing | **Playwright** (end-to-end), unit/integration framework left to be selected during implementation | Chosen specifically for E2E coverage of this platform's highest-risk flows — the order state machine ([3.5.1a](#351a-order-status-transition-rules)), checkout stock-conflict handling ([6.16](#616-checkout-time-stock-unavailability)), and cross-tenant RLS isolation ([0.7](#07-data-isolation-policy)) are exactly the kind of multi-step, real-browser-interaction scenarios Playwright is built for, and its multi-tab/multi-context support is directly useful for testing the cross-tenant-session isolation guarantees this document specifies (e.g. simulating two tenant subdomains in parallel browser contexts within one test). |
| UI | **Tailwind CSS v4 + shadcn/ui as the mandatory foundation** for every interface (not just the Storefront), Radix (shadcn's own primitive layer), Framer Motion, GSAP, Lenis | Retained from the existing storefront design system and **extended as a hard rule across all four interfaces**: every interactive UI element (button, input, dialog, table, dropdown, tabs, tooltip, etc.) is a shadcn/ui component or is composed from shadcn primitives — hand-rolled equivalents of something shadcn already provides are not permitted. Custom CSS is written only as an addition on top of a shadcn component (e.g. Tailwind utility classes for a specific layout need, or a `className` override), never as a replacement for what shadcn already solves — see [0.3e](#03e-component-reuse--shadcn-first-policy) for the full policy and the concrete reuse-check process this drives. |
| Server-state management | **TanStack Query (React Query)** | Caching, background refetching, and optimistic updates for all client-side data fetching against the API (cart, product lists, order tables, chat/diagnosis, dashboard analytics) — maps directly onto [5.23](#523-api-contract-reference)'s stated response contracts (`isPending`/`onError` for the 422/409/429 shapes already defined there). Replaces the current codebase's manual `useState`+`useEffect` fetch pattern in `CartContext`, which does not scale past a handful of screens. Server Components handle initial page-load data fetching as normal; React Query is scoped to client-side interactivity only (cart mutations, live dashboard tables, chat streaming state, CSV import status polling). |
| Client-state management | **React Context** (global UI state) + **Zustand** (complex multi-step client state) | Context retains the current pattern for simple global UI state (modals, nav, cart-drawer open/closed) — no need to replace what already works. Zustand is added specifically for the two spots where Context/prop-drilling would have a real cost: the multi-step signup wizard's draft state ([1.5](#15-signup--get-started), which already persists server-side per step but needs coordinated client-side form state across steps) and the Field Mapping polygon-drawing tool's in-progress boundary state ([4.7](#47-field-mapping)). Not used as a default everywhere — most client state has no complexity that justifies it over Context. |
| Forms & validation | **React Hook Form + Zod** | Every module in this document with a create/edit form (Product, Category, Case Study, Discount, the signup wizard, CSV-import error reporting) needs client-side validation that mirrors the server-side field-level rules already specified per module and in [5.23](#523-api-contract-reference)'s `422` `fields` map contract — Zod schemas are written once per entity and shared between client-side form validation and the API route handler's own validation, so the two never drift out of sync. React Hook Form minimizes re-renders on large forms (the Product form alone has a dozen-plus fields per [3.3.2](#332-create--edit-product)). |
| Toast notifications | **Sonner** | Already an installed dependency in the current codebase but unused — the existing hand-rolled `ToastContext` (custom animation/state/auto-dismiss logic) is retired in favor of it, since Sonner already solves the same problem with less code to maintain, built-in accessibility, and — critically — a `toast.promise()` API that pairs directly with TanStack Query mutations (loading → success/error toast driven by the mutation's own lifecycle, not a manually-called `toast()` after the fact). See [5.24](#524-toast--notification-policy) for the full per-action policy this drives. |

### 0.3 Architecture

Single Next.js application, four logical systems sharing one codebase and one database, separated by route group and by subdomain at the edge. This section gives the high-level shape; the full production folder structure — including how components, hooks, and business logic are separated per interface versus shared — is specified in full in [0.3a](#03a-full-project-folder-structure).

```
agroSphere/
├─ app/
│  ├─ (marketing)/           → Marketing Site           agrosphere.com (root, no subdomain)
│  │   └─ (pricing, get-started, about, contact, terms, privacy, dpa) — no tenant context at all, see 1.9
│  ├─ (platform)/            → Super Admin system      admin.agrosphere.com
│  │   └─ super-admin/...
│  ├─ (dashboard)/           → Company Dashboard        {tenant}.agrosphere.com/dashboard
│  │   └─ dashboard/...
│  ├─ (storefront)/          → User-side site            {tenant}.agrosphere.com
│  │   └─ (existing pages: products, cart, nearby-help, ...)
│  └─ api/
│      ├─ webhooks/stripe      → excluded from tenant/auth middleware, see 5.1.7
│      ├─ chat/                → RAG endpoint
│      ├─ diagnose/            → Kindwise proxy
│      └─ ...tenant-scoped REST handlers
├─ middleware.ts              → subdomain + role resolution, all redirect logic (matcher-scoped, see 5.1.7)
├─ lib/
│  ├─ tenant.ts                → resolves tenant from host (cached), tenant-scoped Prisma helper + RLS session var
│  ├─ auth.ts                  → NextAuth config, database sessions, role guards
│  ├─ rag.ts                    → OpenAI-backed RAG, vendor-isolated
│  ├─ diagnose.ts               → Kindwise-backed diagnosis, vendor-isolated
│  ├─ validation/               → Zod schemas per entity, shared between React Hook Form and API route handlers, see 0.2
│  └─ query-client.ts           → TanStack Query client + query-key factory, see 0.2
├─ stores/                     → Zustand stores, scoped to the two justified cases (signup wizard, field-mapping draw state), see 0.2
├─ inngest/                    → background job functions (versioned event payloads, see 5.3)
└─ prisma/
   ├─ schema.prisma
   └─ migrations/               → includes raw-SQL migrations for RLS policies and the pgvector HNSW index (excluded from drift detection, see 0.7)
```

Every table below the `Tenant` model carries a `tenantId` foreign key. Tenant isolation is enforced in **two independent layers**, not one — see [0.7](#07-data-isolation-policy) for the full policy. This replaces the earlier single-layer design, which an audit correctly flagged as a single point of failure.

### 0.3a Full Project Folder Structure

> The abbreviated tree in [0.3](#03-architecture) shows the routing-level shape; this section is the full, authoritative, production-grade folder structure — every top-level directory, the separation-of-concerns rule each one enforces, and how the **existing codebase maps onto it as a single interface, not the whole project**. The current app (`app/products`, `app/cart`, `components/sections`, `context/CartContext.tsx`, etc.) is the User-Side Storefront interface only — it moves under `app/(storefront)/` and `components/storefront/` largely as-is; it does not define the structure for the three new interfaces, which get their own equally-complete component/hook/logic trees rather than being bolted onto the existing one.

**Governing principle**: separation of concern is enforced on **two independent axes**, not one — (1) *by interface* (Marketing vs. Super Admin vs. Dashboard vs. Storefront — each a distinct audience with distinct auth, distinct data access, distinct visual language per [1.1](#11-purpose--design-direction)) and (2) *by layer* (route/page vs. UI component vs. business logic vs. data access) — a component or a hook lives in exactly one place determined by both axes, never duplicated across interfaces when it's genuinely shared, and never falsely shared when it's actually interface-specific business logic that happens to look similar.

```
agroSphere/
├─ app/
│  ├─ (marketing)/                       ── MARKETING SITE — agrosphere.com root, zero tenant context, see 1.11
│  │  ├─ layout.tsx                       → marketing-specific root layout (distinct <html> theme tokens from storefront,
│  │  │                                      per 1.1) — renders MarketingNavbar and MarketingFooter ONCE here; every
│  │  │                                      page below (Home, Features, Pricing, ...) renders inside this layout and
│  │  │                                      never imports its own nav/footer copy, see 0.3d
│  │  ├─ page.tsx                         → / (Home, 1.2)
│  │  ├─ features/page.tsx                → 1.3
│  │  ├─ pricing/page.tsx                 → 1.4
│  │  ├─ get-started/
│  │  │  ├─ page.tsx                      → 1.5
│  │  │  └─ status/page.tsx               → application-status check, 2.2.1b
│  │  ├─ contact/page.tsx                 → 1.6
│  │  ├─ about/page.tsx                   → 1.7
│  │  ├─ security/page.tsx                → 1.8
│  │  └─ (legal)/
│  │     ├─ terms/page.tsx
│  │     ├─ privacy/page.tsx
│  │     └─ dpa/page.tsx                  → 1.9
│  │
│  ├─ (platform)/                        ── SUPER ADMIN — admin.agrosphere.com, see Section 2
│  │  ├─ layout.tsx                       → platform-role guard (5.1.2), distinct cookie namespace (5.1.4) — renders
│  │  │                                      PlatformSidebar (nav to Tenants/Billing/Settings/Support/Moderation/Audit)
│  │  │                                      ONCE here; every super-admin page renders inside this layout, see 0.3d
│  │  ├─ super-admin/
│  │  │  ├─ login/page.tsx                → 2.1.1
│  │  │  ├─ mfa-setup/page.tsx            → 5.1.6a's hard-gate destination
│  │  │  ├─ page.tsx                      → analytics dashboard, 2.4
│  │  │  ├─ tenants/
│  │  │  │  ├─ page.tsx                   → list, 2.2.2
│  │  │  │  ├─ new/page.tsx               → 2.2.1
│  │  │  │  └─ [id]/
│  │  │  │     ├─ page.tsx                → detail/impersonation launch, 2.2.2
│  │  │  │     └─ edit/page.tsx           → 2.2.1a
│  │  │  ├─ billing/page.tsx              → 2.3
│  │  │  ├─ settings/
│  │  │  │  ├─ page.tsx                   → 2.5
│  │  │  │  ├─ staff/page.tsx             → 2.1.3
│  │  │  │  └─ marketing/page.tsx         → 2.5.4, edits the (marketing) route group's SectionContent
│  │  │  ├─ support/page.tsx              → 2.6.1
│  │  │  ├─ moderation/page.tsx           → 2.6.2
│  │  │  └─ audit/page.tsx                → 2.7
│  │
│  ├─ (dashboard)/                       ── COMPANY DASHBOARD — {tenant}.agrosphere.com/dashboard, see Section 3
│  │  ├─ layout.tsx                       → tenant + role + plan-tier guard (5.1.2, 2.3.1a) — renders DashboardSidebar
│  │  │                                      (the role/plan-scoped nav union from 3.1.1) and DashboardTopbar ONCE here;
│  │  │                                      every dashboard page renders inside this layout, see 0.3d
│  │  └─ dashboard/
│  │     ├─ login/page.tsx                → 3.1.3
│  │     ├─ setup/page.tsx                → 3.2
│  │     ├─ page.tsx                      → home, 3.13
│  │     ├─ account/page.tsx              → 3.1.3a
│  │     ├─ staff/
│  │     │  ├─ page.tsx, invite/page.tsx, [id]/page.tsx   → 3.1
│  │     ├─ products/
│  │     │  ├─ page.tsx, new/page.tsx, [id]/edit/page.tsx, import/page.tsx  → 3.3, 3.14.1
│  │     ├─ categories/page.tsx           → 3.4
│  │     ├─ orders/
│  │     │  ├─ page.tsx, new/page.tsx, [id]/page.tsx, export/page.tsx      → 3.5
│  │     ├─ finance/page.tsx              → 3.5.3
│  │     ├─ discounts/page.tsx            → 3.5.4
│  │     ├─ agents/
│  │     │  ├─ page.tsx, new/page.tsx, [id]/edit/page.tsx                  → 3.6
│  │     ├─ case-studies/page.tsx         → 3.7
│  │     ├─ calculator-config/page.tsx    → 3.8
│  │     ├─ customers/
│  │     │  ├─ page.tsx, [id]/page.tsx, export/page.tsx                    → 3.9
│  │     ├─ reviews/page.tsx              → 3.3.3
│  │     ├─ support/page.tsx              → 3.9.1, 2.6.1 (tenant-facing thread)
│  │     ├─ theme/page.tsx                → 3.10.1
│  │     ├─ pages/page.tsx                → 3.10.2–3.10.4
│  │     ├─ ai/
│  │     │  ├─ documents/page.tsx, chat-logs/page.tsx, settings/page.tsx, diagnosis-log/page.tsx  → 3.11, 3.12
│  │     ├─ analytics/page.tsx            → 3.13.1
│  │     ├─ bundles/page.tsx              → 3.14.9
│  │     ├─ audit/page.tsx                → 3.14.11
│  │     └─ billing/page.tsx              → 2.3.1 tenant-side, always reachable when suspended
│  │
│  ├─ (storefront)/                      ── USER-SIDE STOREFRONT — {tenant}.agrosphere.com, see Section 4
│  │  │                                    (the CURRENT codebase's app/ content moves here almost unchanged — see mapping note below)
│  │  ├─ layout.tsx                       → tenant theme injection (3.10.1), cart/auth providers — renders
│  │  │                                      StorefrontNavbar and StorefrontFooter ONCE here (the existing Header/
│  │  │                                      Footer components, per 0.3c's migration map); every storefront page
│  │  │                                      renders inside this layout, see 0.3d
│  │  ├─ page.tsx                         → Home, 4.2
│  │  ├─ login/page.tsx, signup/page.tsx  → 4.1
│  │  ├─ verify-email/resend/page.tsx     → email verification resend
│  │  ├─ products/
│  │  │  ├─ page.tsx, [id]/page.tsx       → 4.3.1, 4.3.2 (was already at this exact path)
│  │  ├─ cart/page.tsx                    → 4.3.3 (was already at this exact path)
│  │  ├─ checkout/
│  │  │  ├─ page.tsx, success/page.tsx    → 4.3.4
│  │  ├─ precision-dose/page.tsx          → 4.4 (was already at this exact path)
│  │  ├─ case-studies/
│  │  │  ├─ page.tsx, [id]/page.tsx       → 4.5 (was already at this exact path)
│  │  ├─ nearby-help/page.tsx             → 4.6 (was already at this exact path)
│  │  ├─ field-officers/[id]/page.tsx     → 4.6 (was already at this exact path)
│  │  ├─ field-mapping/page.tsx           → 4.7 (was already at this exact path)
│  │  ├─ chatbot/page.tsx                 → 4.8 (was already at this exact path)
│  │  └─ profile/page.tsx                 → 4.10 (was already at this exact path)
│  │
│  └─ api/                               ── shared API surface, tenant-scoped except where noted
│     ├─ auth/[...nextauth]/route.ts
│     ├─ webhooks/stripe/route.ts         → excluded from tenant/auth middleware, see 5.1.7
│     ├─ chat/route.ts                    → 4.8, 5.23
│     ├─ diagnose/route.ts                → 4.9, 5.23
│     ├─ checkout/route.ts                → 4.3.4, 5.23
│     ├─ verify-email/resend/route.ts
│     └─ inngest/route.ts                 → Inngest's own serve handler
│
├─ components/
│  ├─ ui/                                 ── shadcn/ui primitives ONLY (Button, Input, Dialog, Table, ...) — never
│  │                                          business-aware, used by all four interfaces identically, see 0.3b
│  ├─ shared/                             ── cross-interface composite components that are genuinely identical
│  │  │                                       everywhere they're used (not just similar) — e.g.:
│  │  ├─ Toast/                            → Sonner wrapper + the 5.24 taxonomy's styling
│  │  ├─ EmptyState.tsx                    → the empty-state pattern used across every module's list view
│  │  ├─ DataTable/                        → generic sortable/filterable table shell (Product/Order/Customer lists
│  │  │                                       all wrap this, but the column defs and row actions are interface-specific)
│  │  ├─ UserMenu/                         → avatar-triggered account dropdown, composed differently per interface's
│  │  │                                       nav but the dropdown mechanics themselves are identical, see 0.3d
│  │  └─ FormField/                        → React Hook Form + Zod field wrapper (label, error, description)
│  ├─ marketing/
│  │  ├─ layout/ (MarketingNavbar.tsx, MarketingFooter.tsx — rendered ONCE by app/(marketing)/layout.tsx, see 0.3d)
│  │  └─ (PricingTable.tsx, FeatureShowcase.tsx, ... — page-level components)
│  ├─ platform/
│  │  ├─ layout/ (PlatformSidebar.tsx, PlatformTopbar.tsx — rendered ONCE by app/(platform)/layout.tsx, see 0.3d)
│  │  └─ (TenantList.tsx, ImpersonationBanner.tsx, AuditLogTable.tsx, ... — page-level components)
│  ├─ dashboard/                          ── Company Dashboard only, organized by module, ONE FOLDER PER MODULE
│  │  │                                      matching Section 3's numbering exactly (this list is exhaustive, not
│  │  │                                      illustrative — every module with a dashboard route in 3.15 has a folder):
│  │  ├─ layout/ (DashboardSidebar.tsx, DashboardTopbar.tsx — rendered ONCE by app/(dashboard)/layout.tsx, see 0.3d)
│  │  ├─ products/ (ProductForm.tsx, ProductList.tsx, StockAdjustModal.tsx, ...)          → 3.3
│  │  ├─ categories/ (CategoryForm.tsx, CategoryList.tsx)                                  → 3.4
│  │  ├─ orders/ (OrderStatusControl.tsx — enforces 3.5.1a's valid-transition table client-side too, ...) → 3.5
│  │  ├─ finance/ (RevenueChart.tsx, RefundModal.tsx, DisputeLog.tsx)                       → 3.5.3
│  │  ├─ discounts/ (DiscountForm.tsx, DiscountList.tsx)                                    → 3.5.4
│  │  ├─ staff/ (StaffInviteForm.tsx, StaffList.tsx, RoleAssignment.tsx)                    → 3.1
│  │  ├─ agents/ (OfficerForm.tsx, OfficerList.tsx, DuplicateMergeModal.tsx)                → 3.6
│  │  ├─ case-studies/ (CaseStudyForm.tsx, TimelineBuilder.tsx)                             → 3.7
│  │  ├─ customers/ (CustomerList.tsx, CustomerDetail.tsx, BlockCustomerModal.tsx)          → 3.9
│  │  ├─ reviews/ (ReviewModerationList.tsx, TenantResponseForm.tsx)                        → 3.3.3
│  │  ├─ bundles/ (BundleForm.tsx, BundleList.tsx)                                          → 3.14.9
│  │  ├─ ai/ (DocumentUpload.tsx, ChatLogViewer.tsx, DiagnosisMappingRules.tsx)             → 3.11, 3.12
│  │  └─ cms/ (ThemeEditor.tsx, SectionContentEditor.tsx, PagePreview.tsx — renders 3.10's
│  │             page/section editor and the 3.10.2a preview/version-history mechanism)     → 3.10
│  └─ storefront/                         ── User-Side Storefront — THIS IS WHERE THE EXISTING components/ TREE MOVES:
│     ├─ layout/ (renamed to StorefrontNavbar.tsx/StorefrontFooter.tsx from the existing Header/Footer.tsx — fix the
│     │            AgriVision/AgroSphere inconsistency here per 3.10.6 — rendered ONCE by app/(storefront)/layout.tsx,
│     │            see 0.3d, not re-imported into individual storefront pages)
│     ├─ sections/ (existing Hero, WhyChoose, Testimonials, CropSolutions, ChatFAQ, ... — now driven by
│     │              SectionContent props per 3.10.2, not hardcoded JSX)
│     ├─ chatbot/ (existing chatbot components — extended per 4.8's UI-states spec)
│     ├─ cart/ (existing components/sections/cart — extended for server-persisted cart, 4.3.3)
│     ├─ map/ (existing components/sections/map — Nearby Help + Field Mapping, Leaflet-based)
│     └─ auth/ (existing components/auth — rewired to NextAuth per 4.1, replacing the deleted-backend calls)
│
├─ hooks/
│  ├─ shared/                             ── cross-interface hooks, e.g. useDebounce, useMediaQuery
│  ├─ marketing/, platform/, dashboard/, storefront/   ── interface-specific hooks, e.g.
│  │                                          useProductForm (dashboard), useCartMutations (storefront, wraps
│  │                                          TanStack Query), useImpersonationSession (platform)
│  └─ queries/                            ── TanStack Query hook definitions, organized by entity not by interface
│                                             (useProducts.ts, useOrders.ts, useDiagnosis.ts, ...) since the same
│                                             entity's query hooks are called from multiple interfaces (e.g. a Product
│                                             query is used by both the Storefront catalog and the Dashboard product list)
│
├─ context/                               ── React Context providers, retained per 0.2's client-state decision:
│  ├─ ToastProvider.tsx                    → Sonner wrapper (replaces the current ToastContext, see 5.24, 0.2)
│  ├─ CartUIContext.tsx                    → cart-drawer open/closed ONLY (cart data itself is TanStack Query, 4.3.3)
│  └─ (AuthContext.tsx is retired entirely — replaced by NextAuth's own useSession(), not reimplemented)
│
├─ stores/                                ── Zustand, scoped narrowly per 0.2:
│  ├─ signupWizardStore.ts                 → 1.5's multi-step draft state
│  └─ fieldMappingDrawStore.ts             → 4.7's in-progress polygon boundary
│
├─ lib/
│  ├─ tenant.ts                            → resolves tenant from host (cached), tenant-scoped Prisma helper + RLS var
│  ├─ auth.ts                              → NextAuth config, database sessions, role guards
│  ├─ rag.ts, diagnose.ts                  → vendor-isolated AI integrations, see 5.13
│  ├─ stripe.ts                            → Stripe Connect helpers (checkout session creation, application_fee_amount, 5.2.6)
│  ├─ query-client.ts                      → TanStack Query client + query-key factory
│  ├─ validation/                          → Zod schemas per entity — THE SHARED CONTRACT between client forms
│  │                                          (React Hook Form) and API route handlers, one file per entity
│  │                                          (product.schema.ts, order.schema.ts, ...), see 0.2, 5.23
│  ├─ toasts.ts                            → the 5.24 per-action toast-message policy as typed constants, not
│  │                                          hardcoded strings scattered across every mutation call site
│  └─ csp.ts                               → nonce generation helper used by middleware.ts, see 0.2
│
├─ middleware.ts                          → subdomain + role resolution, all redirect logic, CSP nonce injection,
│                                            matcher-scoped to exclude static assets and /api/webhooks/*, see 5.1.7
│
├─ inngest/                               → background job functions (versioned event payloads, see 5.3)
│  ├─ functions/ (embed-document.ts, send-order-email.ts, reset-demo-tenant.ts, ai-cost-anomaly-check.ts, ...)
│  └─ client.ts
│
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│     └─ manual/                          → raw-SQL migrations for RLS policies + the pgvector HNSW index,
│                                            explicitly excluded from Prisma drift detection, see 0.7
│
├─ e2e/                                   → Playwright tests, organized by interface (marketing/, platform/,
│                                            dashboard/, storefront/) plus a cross-cutting/ folder for the
│                                            multi-tenant-isolation and order-state-machine scenarios named in 0.2
│
├─ styles/
│  └─ tokens/                             → per-interface CSS custom-property sets — storefront.css (tenant-themed,
│                                            3.10.1), marketing.css (the distinct-but-related palette from 1.1)
│
├─ types/                                 → shared TypeScript types generated from/aligned with Zod schemas and
│                                            Prisma's generated client, avoiding a third, hand-maintained type source
│
├─ .env.local                             → local-dev environment variables (DATABASE_URL, DIRECT_URL, and every
│                                            other secret named across Section 5) — never committed; see 5.25.2 for
│                                            the manual (non-integration) strategy this file and Vercel's own
│                                            environment-variable settings both follow
└─ .env.example                           → checked-in template listing every required variable name with no real
                                              values, so a new environment can be provisioned without guessing
                                              which secrets this project actually needs
```

### 0.3b Separation-of-Concerns Rules

The folder structure above only holds if these rules are followed consistently — stated explicitly as rules, not left implicit in the tree:

1. **`components/ui/` never imports from `lib/` or knows about entities.** A Button doesn't know what a Product is. This is what keeps the shadcn primitive layer genuinely reusable across all four interfaces without modification.
2. **`components/shared/` is for components proven identical across interfaces, not merely similar.** `DataTable` is shared because its sorting/filtering/pagination shell is identical everywhere; the *column definitions* passed into it are interface-specific and live in `components/dashboard/products/ProductTable.tsx` etc., not in the shared component itself. If a "shared" component starts accumulating interface-specific conditional logic (`if (interface === 'dashboard')`), that's the signal it should be split, not centralized further.
3. **One `lib/validation/` schema per entity, imported by both the form and the API route.** This is what makes [5.23](#523-api-contract-reference)'s `422` `fields` contract actually enforceable as a single source of truth rather than two hand-synced copies (client validation rules and server validation rules independently written and prone to drift).
4. **`hooks/queries/` is organized by entity, not by interface**, because entities are genuinely cross-interface (a Product is queried by both the Storefront catalog and the Dashboard product list) — but the **components that call those hooks** are interface-specific and live in their respective `components/{interface}/` folder. The query hook doesn't know or care which interface is calling it; the component wrapping it does.
5. **No interface's route group imports components from another interface's folder.** `app/(dashboard)/` never imports from `components/storefront/`, even if two components look superficially similar — if they're actually meant to be the same component, it belongs in `components/shared/` per rule 2; if they only look similar but serve different audiences with different data/actions, they stay separate, since a future change to one must not silently affect the other.
6. **Server Components fetch directly via Prisma (through `lib/tenant.ts`'s scoping helper); Client Components fetch via `hooks/queries/` (TanStack Query).** No component mixes both patterns for the same data — this keeps the [0.7](#07-data-isolation-policy) tenant-scoping guarantee enforced at exactly one layer (the Prisma helper) rather than needing to be re-verified in two different fetching mechanisms.

### 0.3c Mapping the Existing Codebase

The current codebase (pre-multi-tenant) maps onto this structure as follows — this is the concrete migration path, not a rewrite from scratch:

| Current location | New location | Notes |
|---|---|---|
| `app/products/`, `app/cart/`, `app/login/`, etc. | `app/(storefront)/products/`, `.../cart/`, `.../login/`, etc. | Route paths unchanged; only the enclosing route group changes. |
| `components/sections/*` | `components/storefront/sections/*` | Content props sourced from `SectionContent` per [3.10.2](#3102-page--section-content-editor) instead of hardcoded JSX — this is the real work, not just moving files. |
| `components/layout/Footer.tsx` (the "AgriVision" inconsistency) | `components/storefront/layout/Footer.tsx` | Fixed as part of the move, per [3.10.6](#3106-pre-migration-codebase-cleanup) — the brand-name cleanup is not deferred past this restructuring. |
| `components/chatbot/*`, `components/ui/chatbot/*` | `components/storefront/chatbot/*` | Extended with the guest-identity mechanism ([4.8](#48-ai-chatbot--rag)) and UI-states spec during the move, not after. |
| `context/CartContext.tsx` | Split: cart *data* → `hooks/queries/useCart.ts` (TanStack Query); cart *drawer UI state* → `context/CartUIContext.tsx` | This is the concrete instance of [0.2](#02-technology-stack)'s server-state/client-state split, not an abstract principle — this exact file is where it applies first. |
| `context/AuthContext.tsx` | Retired | Replaced by NextAuth's `useSession()` directly; not reimplemented in the new structure. |
| `context/ToastContext.tsx` | Retired | Replaced by Sonner via `context/ToastProvider.tsx`, per [5.24](#524-toast--notification-policy). |
| `app/api/chat/route.ts` | `app/api/chat/route.ts` (same path) | Internals rewritten per [4.8](#48-ai-chatbot--rag) — RAG-grounded, tenant-scoped, disclaimer-gated — replacing the hardcoded system-prompt string per [3.10.6](#3106-pre-migration-codebase-cleanup). |
| `data/*.ts` (products, categories, experts, case-studies, calculator-data) | Retired as data sources, retained as **seed data** for [2.5.3](#253-default-content-seeds)'s default tenant content and [5.22.2](#5222-demo-storefront)'s demo tenant population | The static files become the literal input to a seed script, not dead code to delete outright. |

**Everything else in this structure (Marketing, Super Admin, Dashboard) is new** — there is no existing code to map, since those three interfaces did not exist before this specification.

### 0.3d Layout-Level Navigation & Chrome — One Instance Per Interface, Never Per Page

> Added as an explicit rule rather than left implicit in Next.js's own layout-nesting mechanism, since "the framework technically supports shared layouts" and "every developer actually uses them instead of copy-pasting a navbar into each page" are two different guarantees — this section closes that gap for good.

**The rule**: each of the four interfaces has **exactly one** navigation component and **exactly one** footer/chrome component, each rendered **exactly once**, in that interface's root `layout.tsx` — never imported or re-rendered inside an individual `page.tsx`. A page never builds its own copy of the nav, even a "slightly different" one; if a specific page genuinely needs different nav behavior (e.g. the Marketing signup wizard hiding the main nav to reduce distraction during signup, [1.5](#15-signup--get-started)), that is expressed as a **prop passed down to the shared component from the layout** (e.g. `<MarketingNavbar variant="minimal" />`), never a second, separately-maintained nav component.

| Interface | Nav component | Chrome/footer component | Lives in | Rendered by |
|---|---|---|---|---|
| Marketing | `MarketingNavbar` | `MarketingFooter` | `components/marketing/layout/` | `app/(marketing)/layout.tsx` only |
| Super Admin | `PlatformSidebar` | `PlatformTopbar` (impersonation-session banner lives here, [2.2.2a](#222a-impersonation-security-model)) | `components/platform/layout/` | `app/(platform)/layout.tsx` only |
| Company Dashboard | `DashboardSidebar` (role/plan-scoped nav union, [3.1.1](#311-staff-roles)) | `DashboardTopbar` (staff account menu, plan-tier badge) | `components/dashboard/layout/` | `app/(dashboard)/layout.tsx` only |
| Storefront | `StorefrontNavbar` | `StorefrontFooter` | `components/storefront/layout/` | `app/(storefront)/layout.tsx` only |

**Why four separate nav components, not one shared `Navbar`**: this is a deliberate exception to [0.3b](#03b-separation-of-concerns-rules) rule 2's "shared means proven-identical, not merely similar" test, applied correctly — the four navs are not proven-identical, they're deliberately different (Marketing's nav sells the platform and has a "Get Started" CTA; the Dashboard's nav is a role-scoped sidebar with no equivalent in Marketing at all; Super Admin's nav has zero tenant branding since it's platform-owned). Forcing them into one `components/shared/Navbar.tsx` would violate rule 2 in the other direction — accumulating `if (interface === ...)` branches inside a component that's supposed to be interface-agnostic. The actual shared thing across all four is the **pattern** (one nav, one footer, rendered once, in the layout), not the component itself — and that pattern is what this section enforces.

**What is genuinely shared**: the primitive pieces a nav is built from — `components/ui/DropdownMenu`, `components/ui/Sheet` (mobile nav drawer), `components/shared/UserMenu` (an avatar-triggered dropdown pattern reused by both the Dashboard's staff account menu and, in a simpler form, the Storefront's customer account menu) — these live in `components/ui/`/`components/shared/` per the existing rules, and each interface's nav component composes them, rather than each interface's nav being built from scratch.

### 0.3e Component Reuse & shadcn-First Policy

> Two related rules made explicit here, since "components can technically be shared" is a different guarantee from "a developer actually checks for an existing component before building a new one," and "shadcn is in the stack" is a different guarantee from "the whole UI is actually built on it." Both gaps are closed as concrete, checkable process rules, not aspirational statements.

**0.3e.1 shadcn/ui is the mandatory foundation, in strict precedence order**

Every interactive UI element across all four interfaces is built in this order, never skipping a step to jump straight to custom code:

1. **A shadcn/ui component, used as-is or via its own documented variant/props API** (e.g. `<Button variant="destructive">`, `<Dialog>`, `<Table>`, `<Select>`, `<Tabs>`, `<Tooltip>`, `<DropdownMenu>`, `<Sheet>`, `<Form>` bound to React Hook Form). This covers the large majority of this platform's actual UI surface — every list, form, modal, and menu specified across Sections 1–4 maps onto an existing shadcn primitive.
2. **A shadcn component extended with Tailwind utility classes or a `className` override**, when the base component is right but a specific spacing/color/layout tweak is needed for this project's design language (e.g. [1.1](#11-purpose--design-direction)'s "lightly B2B-SaaS, not fully generic" direction, or a tenant's own theme tokens from [3.10.1](#3101-brand--theme-tokens) applied via CSS custom properties). This is genuinely "custom CSS on top of shadcn," matching the requirement stated in [0.2](#02-technology-stack) — additive styling, not a replacement implementation.
3. **A shadcn component composed with other shadcn/Radix primitives into a new, project-specific component** (e.g. `DataTable` in `components/shared/` — built from shadcn's `Table` + `DropdownMenu` for column visibility + `Input` for the filter bar, per [0.3a](#03a-full-project-folder-structure)), when the platform needs a pattern shadcn doesn't ship as a single component but can be assembled from its primitives.
4. **Fully custom component, hand-built from Radix primitives directly (not shadcn) or from scratch** — reserved for cases with no reasonable shadcn/Radix composition path (this platform's genuinely bespoke pieces: the Leaflet map components for [4.6](#46-nearby-help--agents)/[4.7](#47-field-mapping), the Framer Motion/GSAP-driven marketing animations, the multi-step signup wizard's step-transition UI). Even here, form controls *within* these custom components (a text input inside the field-mapping tool's sidebar, for instance) still use shadcn's `Input`, not a hand-rolled one — "this feature is custom" does not mean "every control inside it is custom."

A pull request introducing a hand-rolled button, modal, dropdown, or form input where a shadcn equivalent exists is a defect against this policy, not a style preference to negotiate case-by-case.

**0.3e.2 Component Reuse Check — Required Before Building New**

Before writing a new component anywhere in `components/`, the actual, required check is:

1. **Does this exact component already exist in `components/ui/`?** (i.e., is this just a shadcn primitive being used, not a new component at all.) If yes, use it directly — stop here.
2. **Does this component already exist in `components/shared/`?** (i.e., has this exact need already been solved once, generically, for cross-interface use — `EmptyState`, `DataTable`, `FormField`, `Toast`, `UserMenu` per [0.3a](#03a-full-project-folder-structure).) If yes, use it — stop here.
3. **Does a near-identical component already exist in a *different* interface's folder** (e.g. building a customer list for the Dashboard and a `CustomerList`-shaped table already exists somewhere)? If the two are **proven-identical** (same data shape, same interaction pattern, only the audience differs) — this is the trigger to **promote** the existing component up into `components/shared/`, per [0.3b](#03b-separation-of-concerns-rules) rule 2, rather than duplicating it a second time in the new interface's folder. If they only *look* similar but serve genuinely different data/actions (the [0.3d](#03d-layout-level-navigation--chrome--one-instance-per-interface-never-per-page) nav-component reasoning applies here too), they correctly stay separate — this check is a judgment call against rule 2's test, not an automatic "always merge."
4. **Only if none of the above apply**, a new component is created, placed in the correct interface-specific folder per [0.3a](#03a-full-project-folder-structure)'s tree, built following [0.3e.1](#03e1-shadccnui-is-the-mandatory-foundation-in-strict-precedence-order)'s shadcn-first precedence order.

This is the same discipline [0.3b](#03b-separation-of-concerns-rules)'s rules already imply structurally; this subsection makes it an explicit, sequential checklist a developer actually runs through, rather than a principle to remember unprompted.

### 0.4 Tenancy Model

**Routing** — Subdomain-per-tenant: `bayer.agrosphere.com`, `syngenta.agrosphere.com`. Resolved in `middleware.ts` by reading `request.headers.get("host")`, stripping the root domain, and matching against a **cached** `Tenant.subdomain` lookup (see [5.10](#510-caching-strategy) — never an uncached DB hit on every request).

**Storefront isolation** — Fully isolated per tenant — no shared marketplace. A farmer visiting one tenant's subdomain sees only that company's products, agents, case studies, and branding.

**Subdomain permanence** — Once assigned, a subdomain is **never reissued**, even after a tenant is hard-deleted. This closes a stale-session edge case: a long-lived session cookie referencing a deleted tenant can never be reinterpreted as belonging to a different, newer tenant. See [2.2.3](#223-suspend--reactivate--delete).

**Subdomain legitimacy check** — Uniqueness alone is not sufficient at signup. See [2.2.1](#221-tenant-onboarding) for the trademark/rights-holder attestation step added to approval.

**Routes at MVP** — Fixed page structure shared across all tenants (`/products`, `/cart`, etc). Content within each page is tenant-editable; the URL path is not, at MVP.

**Routes — fast follow** — Post-MVP: tenants may rename core route slugs (`/products` → `/shop`) via a catch-all resolver. See [5.1.8](#518-fast-follow-renameable-route-slugs).

### 0.5 Roles & Actors

| Role | System | Scope | Description |
|---|---|---|---|
| `platform_owner` | super-admin | All tenants | Full platform control — the AgroSphere operator. Single highest-privilege role. |
| `platform_staff` | super-admin | All tenants (limited) | Internal support/ops staff with restricted platform admin access (e.g. support tickets, no billing config). Impersonation access is logged and reason-gated — see [2.2.2a](#222a-impersonation-security-model). |
| `tenant_owner` | dashboard | One tenant | The pesticide company's primary account — created at tenant onboarding, full control over that tenant's dashboard, billing, and staff. |
| `tenant_admin` | dashboard | One tenant | Invited staff with full dashboard access except billing/Stripe settings and staff removal. |
| `order_manager` | dashboard | One tenant | Scoped to Order Management + Discounts/Coupons only. See [3.1.1](#311-staff-roles). |
| `finance_manager` | dashboard | One tenant | Scoped to Finance & Revenue only (Standard+ plan feature). See [3.1.1](#311-staff-roles). |
| `product_manager` | dashboard | One tenant | Scoped to Products, Categories, and Dosage Calculator Config only. See [3.1.1](#311-staff-roles). |
| `content_manager` | dashboard | One tenant | Scoped to Storefront CMS/Theme and Case Studies only. See [3.1.1](#311-staff-roles). |
| `field_officer` | dashboard (read-only profile) + storefront (public) | One tenant | The in-app "Agent" — an agronomist/expert listed publicly for farmers to contact. Managed by tenant staff; not a login role at MVP (see [3.6](#36-field-officers--agents-management)). |
| `customer` | storefront | One tenant (per account) | The farmer — browses, buys, uses the chatbot/diagnosis, contacts field officers. |
| `guest` | storefront | One tenant | Unauthenticated visitor — can browse, use calculators/diagnosis, but must register to check out or save history. |

**A staff account may hold more than one scoped role simultaneously** (e.g. `order_manager` + `finance_manager` on one person at a small company). This requires `User.roles` to be an **array**, not a single enum — see [0.6](#06-core-data-model), which corrects a contradiction in the original design where a single-value `role` field could not represent this.

### 0.6 Core Data Model

Full Prisma-level schema is implementation detail, but every module below references these entities. Field lists here are the authoritative contract for what each entity stores. Every tenant-scoped table additionally carries the indexes and RLS policy described in [0.7](#07-data-isolation-policy).

**Tenant — the root of the whole system**

| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | Primary key. |
| name | string | Company legal/display name. **Editable post-approval by `platform_owner`** — see [2.2.1a](#221a-editing-an-approved-tenant) for the correction workflow. |
| subdomain | string, unique, immutable, never reissued | e.g. `bayer` → `bayer.agrosphere.com`. **Not editable post-approval, by design** — see [2.2.1a](#221a-editing-an-approved-tenant). |
| customDomain | string, nullable | Optional white-label domain, post-MVP. |
| businessCategory | string (controlled taxonomy, e.g. "Pesticide Manufacturer," "Agri-Input Distributor," "Fertilizer Producer") | Collected at signup ([1.5](#15-signup--get-started)), load-bearing for the regulatory self-declaration gate ([5.14.3](#5143-tenant-onboarding-regulatory-review)). Editable post-approval — see [2.2.1a](#221a-editing-an-approved-tenant). |
| status | enum | `pending` · `active` · `suspended` · `cancelled`. Cached with a 30–60s TTL, actively invalidated on change — see [5.10](#510-caching-strategy). A `pending` application has a bounded review SLA — see [2.2.1b](#221b-pending-application-sla--applicant-status-visibility). |
| pendingSince | datetime, nullable | Set when `status` transitions to `pending`; drives the review-SLA/escalation mechanism in [2.2.1b](#221b-pending-application-sla--applicant-status-visibility). |
| plan | enum | `startup` · `standard` · `business` — drives the feature gating matrix, see [2.3.1a](#231a-feature-gating-matrix). |
| priceLockedAt | datetime, nullable | Snapshot timestamp of when the tenant's current plan price was locked in — see [2.3.4](#234-pricing-changes--grandfathering) for how this interacts with a future platform-wide price change. |
| stripeConnectAccountId | string, nullable | Tenant's own Stripe Express account ID for payouts. |
| stripeOnboardingComplete | boolean | Gates whether the tenant can accept live payments. Flipped to `false` automatically on a Stripe `account.updated`/`deauthorized` event — see [5.2.3](#523-account-restriction--deauthorization-handling). |
| stripeReserveTier | enum | `standard` · `elevated` · `high-risk` — drives the rolling-reserve policy for chargeback exposure, see [5.2.2](#522-dispute-chargeback--reserve-policy). |
| regulatoryReviewStatus | enum | `not_required` · `pending` · `approved` — set when the tenant's business category requires restricted-pesticide licensing review, see [5.14](#514-regulatory-compliance-pesticide-sales). |
| businessRegistrationNumber | string, nullable | Captured at onboarding for fraud/legitimacy review, see [2.2.1](#221-tenant-onboarding). |
| defaultLocale, defaultCurrency | string | Drives storefront default language/currency, see [0.8](#08-localization--currency). |
| isDemo | boolean, default false, platform-owner-only field | Marks the permanent public demo tenant — gates test-mode-only Stripe, suppressed outbound email, and daily data reset. See [5.22](#522-demo-environment). |
| chatbotEnabled | boolean | Tenant's own on/off switch for the live chatbot widget, Business plan only. Default `false`. See [3.11.6](#3116-chatbot-live-toggle). |
| storageUsedBytes | bigint, default 0 | Running counter of Cloudinary storage consumed, incremented/decremented on every upload/delete across Products, Case Studies, Theme assets, and RAG Documents — see [5.4.1](#541-storage-quota-enforcement) for the enforcement mechanism this field drives. |
| staffSeatsUsed | int, default 1 | Running count of active staff `User` rows for this tenant (including the owner) — checked against the plan's seat cap on every invite. See [3.1.2a](#312a-seat-cap-enforcement). |
| defaultLowStockThreshold | int, default 5 | Tenant-wide fallback used when a `Product.lowStockThreshold` is unset — see [3.3.1b](#331b-low-stock-threshold-configuration). |
| createdAt / updatedAt | datetime | — |

**User — shared table across all three systems, disambiguated by roles + tenantId**

| Field | Type | Notes |
|---|---|---|
| id | string | Primary key. |
| tenantId | string, nullable | Null for `platform_owner`/`platform_staff`; required for all tenant-scoped roles. |
| roles | enum[] | **Array**, not a single value — see [0.5](#05-roles--actors). A staff account may hold multiple scoped roles. |
| name | string | — |
| email | string | **Uniqueness is scoped to `(email, tenantId)`, not global** — the same email may have separate accounts on different tenants' storefronts, matching the "no cross-tenant login carryover" requirement in [4.1](#41-authentication). For platform roles (`tenantId` null), email is globally unique. This decision directly resolves how password reset ([5.1.9](#519-password-reset-flow)) and login must scope their lookups. |
| passwordHash | string, nullable | Null if user only ever used an OAuth provider via NextAuth. |
| emailVerified | datetime, nullable | NextAuth standard field, actively enforced — see [4.1](#41-authentication)'s "Email verification". |
| mfaEnabled | boolean, default false | See [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts) — mandatory for platform roles, strongly enforced for `tenant_owner`. |
| mfaSecret | string, nullable, encrypted at rest | TOTP secret, same encryption standard as [5.7](#57-per-tenant-secrets). |
| sessionVersion | int, default 0 | Incremented on password reset, role change, staff removal, or MFA reset/disable, to force revalidation of any cached session data — see [5.1.6](#516-session-freshness--revocation-policy). |
| createdAt / updatedAt | datetime | — |

**Product, Category, Order, OrderItem — commerce core (all tenantId-scoped)**

| Entity | Key fields |
|---|---|
| Product | id, tenantId, categoryId, name, description, price, currency, images[], stock, **stockVersion** (int, default 0 — optimistic-concurrency counter, see [3.3.1a](#331a-stock-decrement--concurrency-control)), **lowStockThreshold** (int, nullable, per-product override; falls back to a tenant-level default if unset — see [3.3.1b](#331b-low-stock-threshold-configuration)), sku, rating, role tag (pest/fungal/growth/weed), isActive, **archivedAt** (nullable — soft-delete when order history exists, see [3.3.1](#331-product-list)), **regulatoryClass** (general_use / restricted_use), **approvedLabelUrl** (Cloudinary, required if restricted_use), **requiresApplicatorCredential** (boolean), **priceBreaks[]** (`{minQty, price}[]`, nullable, Standard+ — see [3.14.10](#31410-group--volume-pricing)) |
| Category | id, tenantId, name, description, icon, image |
| Order | id, tenantId, customerId, status, items[], subtotal, tax, total, currency, **applicationFeeAmount** (the platform's 0.5% take-rate slice of this order, see [5.2.6](#526-take-rate-collection-mechanism)), stripePaymentIntentId, shippingAddress, **applicatorCredentialRef** (nullable, captured if any line item is restricted_use), **cancelledBy** (enum: `staff` / `customer`, nullable — see [3.5.1a](#351a-order-status-transition-rules) and [6.15](#615-farmer-initiated-order-cancellation)), createdAt |
| OrderItem | id, orderId, **bundleId** (nullable FK → Bundle, if this line item is part of a bundle purchase — see [3.14.9](#3149-product-bundles--kits)), productId, name (snapshot), price (snapshot), quantity |
| Bundle | id, tenantId, name, description, image, bundlePrice, items (`{productId, quantity}[]`), isActive — see [3.14.9](#3149-product-bundles--kits) for stock-decrement and partial-availability behavior |

Products marked `regulatoryClass = restricted_use` cannot be published (`isActive = true`) without a non-null `approvedLabelUrl` — enforced at the API layer, not just the UI. See [5.14](#514-regulatory-compliance-pesticide-sales).

`Order.status` follows a strict, enforced state machine — see [3.5.1a](#351a-order-status-transition-rules); the dashboard status-change UI only ever offers the next valid state(s), never an arbitrary jump.

**AI & diagnosis entities (all tenantId-scoped)**

| Entity | Key fields |
|---|---|
| TenantDocument | id, tenantId, fileName, fileUrl (Cloudinary, signed delivery), status (processing/ready/failed/pending_review/flagged/**rejected** — `rejected` is the terminal state when human moderation review fails a document, distinct from `failed`'s pipeline-error meaning, see [2.6.2a](#262a-moderation-rejection--resubmission)), uploadedBy, moderationScore, createdAt |
| DocumentChunk | id, documentId, tenantId, content, embedding (`Unsupported("vector(1536)")`, raw-SQL only — see [0.7](#07-data-isolation-policy)), chunkIndex |
| ChatSession / ChatMessage | id, tenantId, userId (nullable for guest), sessionId, **anonymousId** (nullable — a client-issued UUID cookie for guests with no `userId`, the identity used for guest rate-limiting and disclaimer-acknowledgment persistence, see [5.6a](#56a-guest-identity-for-ai-rate-limiting)), role, content, sourceChunkIds[], **disclaimerAcknowledgedAt**, createdAt |
| DiagnosisRequest | id, tenantId, userId (nullable), **anonymousId** (nullable, same guest-identity mechanism as ChatSession), imageUrl (Cloudinary, signed delivery), kindwiseResponse (json), **status** (processing/complete/failed — the state the diagnosis-flow narrative in [6.4](#64-farmer-diagnosis-to-purchase-flow) depends on), detectedDisease, confidence, **belowConfidenceThreshold** (boolean), recommendedProductIds[], **disclaimerAcknowledgedAt**, createdAt |

**Trust & integrity entities**

| Entity | Key fields |
|---|---|
| ProductReview | id, tenantId, productId, customerId, orderId (**required** — proof of purchase, see [3.3.3a](#333a-review-integrity)), rating, body, **tenantResponse** (text, nullable — a seller reply, see [3.3.3](#333-reviews-moderation)), createdAt |
| StripeWebhookEvent | id (Stripe event id, unique constraint), tenantId (nullable for platform-level events), processedAt — dedup ledger, see [5.2.4](#524-webhook-idempotency--deduplication) |
| ImpersonationSession | id, adminUserId, tenantId, reason, startedAt, endedAt, expiresAt — append-only audit log, see [2.2.2a](#222a-impersonation-security-model) |
| AuditLog | id, actorUserId, **actorNameSnapshot** (string — captured at write time so an entry remains attributable even if the acting `User` is later removed, see [3.1.4a](#314a-staff-attribution-after-removal)), tenantId (nullable), action, targetType, targetId, metadata (json), createdAt — general-purpose audit trail for sensitive actions (role changes, plan changes, tenant suspension, product deletion). **Retention: indefinite**, no purge/archive schedule — this is the evidentiary record for impersonation and dispute resolution, and unlike farmer PII ([5.15](#515-data-ownership--gdpr-posture)) is not subject to an erasure request, since audit entries record actions taken by staff/admins in their operational capacity, not personal data collected from a data subject in the GDPR sense. |
| SupportTicket | id, tenantId (nullable — pre-sales inquiries from the Marketing Site have no tenant yet), type (`pre_sales` / `platform_issue` / `billing` / `tenant_support`), priority (`normal` / `priority`), status (`open` / `in_progress` / `resolved` / `closed` / `reopened`), assignedTo (FK → platform_staff User, nullable until triaged), submittedBy, subject, body, **slaBreachAt** (computed at creation from `priority`, see [2.6.1](#261-support-tickets)), createdAt, updatedAt — see [2.6.1](#261-support-tickets) for the full lifecycle/SLA model this entity backs. |
| TicketReply | id, ticketId (FK → SupportTicket), authorId, body, createdAt — the reply thread a tenant can see from `/dashboard/support` per [2.6.1](#261-support-tickets). |

**Field officer entities — NOT tenant-owned like the rest of the schema, see [3.6](#36-field-officers--agents-management)**

| Entity | Key fields |
|---|---|
| Officer | id, name, image, phone, whatsapp, experience, specializations[], platformVerified (boolean, platform-level identity check, distinct from per-tenant `isVerified`), **correctionRequestedAt** (datetime, nullable — any tenant staff can flag a field as needing correction, e.g. an outdated phone number; routes to platform-staff review since no MVP self-service officer login exists, see [3.6.2a](#362a-officer-identity-correction-mvp-workaround)), createdAt — **not** `tenantId`-scoped; a real person's identity is a single row regardless of how many tenants list them. |
| OfficerTenantListing | id, officerId (FK → Officer), tenantId, role (free text, e.g. "Senior Agronomist" — can differ per tenant listing), lat, lng, availability, isVerified (tenant-controlled trust badge, independent per tenant), rating, reviewsCount (per-tenant, not shared — a farmer's review is of the officer's service *through that tenant*), consentRecordedAt, isActive, createdAt — this is the actual tenant-scoped row every dashboard/storefront query filters on. |

**CMS / theming entities (all tenantId-scoped, with one platform-level exception noted below)**

| Entity | Key fields |
|---|---|
| TenantTheme | tenantId, primaryColor, secondaryColor, accentColor, fontFamily, logoUrl, faviconUrl |
| PageConfig | id, tenantId, pageKey, isEnabled, metaTitle, metaDescription, ogImage, slug (fast-follow) |
| SectionContent | id, **tenantId (nullable — see the platform-content exception below)**, pageKey, sectionKey, headline, subheadline, bodyText, imageUrl, order, isVisible, **revisionOf** (nullable FK → an earlier `SectionContent` row of the same `pageKey`+`sectionKey`, giving every edit a version chain — see [3.10.2a](#3102a-preview--version-history)), **publishedAt** (nullable — null means draft/unpublished, see [3.10.2a](#3102a-preview--version-history)), **locale** (see [0.8](#08-localization--currency)) |

**Second intentional exception to tenant-scoping: `SectionContent` for the Marketing Site.** [1.7](#17-about-us) (About Us) and [1.8](#18-security--trust) explicitly reuse the `SectionContent` pattern for platform-owned, single-instance content (there is exactly one About page, one Security page — not one per tenant). This requires `SectionContent.tenantId` to be **nullable**, with a `tenantId IS NULL` row understood as platform-scoped marketing content, editable only by `platform_owner` via `/super-admin/settings/marketing` (see [2.5.4](#254-marketing-site-content)). The RLS policy on `SectionContent` ([0.7](#07-data-isolation-policy)) is extended accordingly: `USING (tenant_id = current_setting('app.tenant_id')::text OR tenant_id IS NULL)` for read access, but write access to `tenantId IS NULL` rows is additionally gated at the application layer to `platform_owner` only, since RLS alone cannot distinguish "platform owner editing platform content" from "any authenticated user reading it." This is the second and final documented exception to the "every table is tenant-scoped" rule (the first being `Officer`, [0.7](#07-data-isolation-policy)) — both are named explicitly here so neither is a silent, undocumented special case.

### 0.7 Data Isolation Policy

This is the single most important section in the document — every module above depends on it holding. The original design relied on one layer (an application-level Prisma helper injecting `WHERE tenantId = ctx.tenantId`); an audit correctly identified this as a single point of failure, since a forgotten filter in one new raw query, migration script, or admin tool silently produces a cross-tenant data leak.

**Layer 1 — Application-level scoping (primary, developer-facing).** Every Prisma query in tenant-scoped code paths passes through a `lib/tenant.ts` helper that injects `WHERE tenantId = ctx.tenantId`, where `ctx.tenantId` is **re-derived from the verified session on every call**, never trusted from a request header or client-supplied value (this closes the defense-in-depth gap described in [5.1.5](#515-defense-in-depth-against-middleware-bypass)).

**Two deliberate exceptions to tenant-scoping, and only these two.** (1) `Officer` (the platform-level field-officer identity, see [0.6](#06-core-data-model) and [3.6](#36-field-officers--agents-management)) is intentionally shared, since a real officer may be listed by multiple tenants and a duplicated per-tenant identity would drift — it holds only non-sensitive, publicly-listable reference data, never anything commercially sensitive, and the actual farmer-facing query surface is always the fully tenant-scoped `OfficerTenantListing`. (2) `SectionContent.tenantId` is nullable to support the Marketing Site's platform-owned content ([1.7](#17-about-us), [1.8](#18-security--trust)) — see [0.6](#06-core-data-model) for the exact RLS extension this requires. Any future table added to the schema is tenant-scoped by default; a new shared/unscoped table requires the same explicit justification as these two, not a convenience shortcut.

**Layer 2 — Postgres Row-Level Security (mandatory second layer, database-enforced).** Every tenant-scoped table has an RLS policy: `USING (tenant_id = current_setting('app.tenant_id')::text)`. `app.tenant_id` is set via `SET LOCAL` at the start of every request's database transaction, inside `prisma.$transaction(...)`, so it applies consistently even under PgBouncer transaction-mode pooling. RLS is the backstop that catches exactly the failure mode Layer 1 cannot guard against — a developer forgetting the helper. **A query that would leak cross-tenant data under Layer 1 alone returns zero rows under Layer 2**, not another tenant's rows.

**RLS bypass for platform-level cross-tenant aggregation.** RLS as specified above would make Super Admin's own cross-tenant analytics queries ([2.4](#24-platform-analytics)) return zero or single-tenant rows, not the platform-wide aggregates those dashboards require — a naive `SELECT SUM(...)` run under a request-scoped `app.tenant_id` session variable never sees rows outside that one tenant. This is resolved with a **dedicated Postgres role for platform-level aggregate queries** (`platform_analytics_role`), created with `BYPASSRLS` and used **exclusively** by the specific, narrow set of query functions backing [2.4.1](#241-cross-tenant-dashboard) and [2.4.2](#242-tenant-leaderboards) — never by any tenant-scoped or dashboard-facing code path, and never exposed to a Prisma client instance that also serves ordinary tenant-scoped requests. Every query executed under this role is: (a) restricted to `groupBy`/aggregate SQL only (counts, sums, averages — matching the pattern already specified in [2.4.2](#242-tenant-leaderboards)), never a query that could return individual tenant-scoped row contents (e.g. raw `Order` or `ChatMessage` rows) to a Super Admin screen, and (b) logged to `AuditLog` as a platform-analytics-query action, so `BYPASSRLS` usage itself remains auditable rather than being an invisible, unlogged escape hatch from the isolation model this section otherwise treats as inviolable. This is the **only** sanctioned use of `BYPASSRLS` anywhere in the system — no other code path, including impersonation ([2.2.2a](#222a-impersonation-security-model)), uses it; impersonation instead works entirely within the normal RLS boundary by setting `app.tenant_id` to the impersonated tenant for the duration of the session.

**Raw SQL / vector query policy.** pgvector similarity search and any embedding read/write must use `$queryRaw`/`$executeRaw` (Prisma cannot natively type the `vector` column). All such raw queries are required to bind `tenantId` as a parameter and are covered by the same RLS policy as a backstop. A lint rule fails CI if a raw query string references a tenant-scoped table without a corresponding bound `tenantId` parameter.

**Migration policy for the pgvector index.** Prisma's schema-drift detection does not understand `vector` columns or HNSW indexes and will attempt to drop a manually created index on the next `prisma migrate dev`/`db push`. The HNSW index is created via a raw-SQL migration file explicitly excluded from Prisma's drift-diff checks (or applied via a one-time `psql` script outside the normal migration flow, versioned separately in `prisma/migrations/manual/`).

**Vector index type.** HNSW, not IVFFlat — tenants continuously upload and delete documents (a write-heavy-ish workload), and IVFFlat's bulk-retrain requirement degrades badly under frequent updates. `maintenance_work_mem` is sized for HNSW build at deploy time. Because HNSW memory scales with total vector count platform-wide (not per-tenant), index size is monitored as a direct infrastructure cost driver in Super Admin analytics ([2.4.1](#241-cross-tenant-dashboard)).

**Vector search recall at scale.** A `WHERE tenantId` filter applied after an HNSW graph walk is a documented pgvector weak point — if one tenant's chunks are a small fraction of the shared `DocumentChunk` table, ANN recall silently degrades unless search depth (`ef_search`) is increased, which increases latency. `DocumentChunk` is **partitioned by `tenantId`** (native Postgres table partitioning) once the platform exceeds roughly 50 active tenants with RAG enabled, so each partition's HNSW index only ever sees one tenant's vectors — eliminating the filter-then-graph-walk problem entirely. Below that scale, a composite index on `(tenantId)` plus an explicitly tuned `ef_search` is sufficient and is load-tested before the Business plan's chatbot ships.

**Zero-downtime migration policy.** Because this is one shared schema (not schema-per-tenant), every migration runs against every tenant's data in one shot — a single tenant's feature request cannot be allowed to risk another tenant's uptime. All schema migrations follow the expand-contract pattern: add a nullable column → backfill in batches → make non-null in a later migration. Migrations are tested against a production-sized snapshot before deploy given the platform-wide blast radius. Because tenant onboarding ([2.2.1](#221-tenant-onboarding)) synchronously seeds CMS rows, all such seed logic is written against additive/nullable-first schema assumptions so an in-flight onboarding never fails or produces malformed rows if a migration runs concurrently.

### 0.8 Localization & Currency

Agri-input buyers are disproportionately concentrated in markets where English-only UI is a real adoption barrier (documented for comparable agri-AI products). This is treated as an **MVP requirement**, not a fast-follow, because it is closer to a go/no-go condition for the actual target market than a nice-to-have.

- **Storefront UI language**: `SectionContent` and `PageConfig` carry a `locale` field; tenants can provide localized copy per section. A language switcher on the storefront falls back to the tenant's `defaultLocale` when a translation is missing, never to a blank string.
- **Chatbot / RAG language**: the system prompt instructs the model to respond in the customer's query language regardless of the uploaded document's language; OpenAI's embeddings and completion models handle cross-lingual retrieval adequately for the supported language set (validated during QA against representative non-English farmer queries before the Business plan ships).
- **Currency**: `Product.currency` and `Tenant.defaultCurrency` are explicit fields; Stripe Checkout's presentment-currency feature displays the tenant's currency at checkout. Multi-currency pricing per product (not just single-currency-per-tenant) is supported from the initial schema so it does not require a later migration.
- **Dosage units**: the Precision Dose Calculator ([3.8](#38-dosage-calculator-configuration)) already stores unit strings per medicine (`Liters`, `kg`); this is retained and extended with a locale-aware unit-label lookup for display only — the underlying calculation is unit-agnostic.

### 0.9 Worked Examples

> One fully realistic record per major entity, so every abstract field table earlier in this document is grounded in something concrete a developer can copy-check field-by-field. Tenant is `bayer` throughout, to show how the same tenant's data threads through every entity.

**Tenant**
```json
{
  "id": "cltn_8f2a1c",
  "name": "Bayer Crop Science Pakistan",
  "subdomain": "bayer",
  "customDomain": null,
  "businessCategory": "Pesticide Manufacturer",
  "status": "active",
  "pendingSince": null,
  "plan": "business",
  "priceLockedAt": "2026-01-14T09:00:00Z",
  "stripeConnectAccountId": "acct_1P8xQ2K...",
  "stripeOnboardingComplete": true,
  "stripeReserveTier": "standard",
  "regulatoryReviewStatus": "approved",
  "businessRegistrationNumber": "0058291-PK",
  "defaultLocale": "en",
  "defaultCurrency": "PKR",
  "isDemo": false,
  "chatbotEnabled": true,
  "storageUsedBytes": 1847293184,
  "staffSeatsUsed": 4,
  "defaultLowStockThreshold": 5,
  "createdAt": "2026-01-10T14:22:00Z"
}
```

**User (a farmer customer)**
```json
{
  "id": "usr_7d3e19",
  "tenantId": "cltn_8f2a1c",
  "roles": ["customer"],
  "name": "Imran Baig",
  "email": "imran.baig@example.com",
  "passwordHash": "$2b$12$...",
  "emailVerified": "2026-02-03T11:04:00Z",
  "mfaEnabled": false,
  "sessionVersion": 0,
  "createdAt": "2026-02-03T10:58:00Z"
}
```

**Product** (a `restricted_use` item, showing the full regulatory field set in context)
```json
{
  "id": "prd_4b91c0",
  "tenantId": "cltn_8f2a1c",
  "categoryId": "cat_pest_01",
  "name": "AgriShield Pro 500EC",
  "description": "Broad-spectrum insecticide for cotton and rice, effective against whitefly and jassid. Apply as a foliar spray at early infestation stage for best results.",
  "price": 3200.00,
  "currency": "PKR",
  "images": ["https://res.cloudinary.com/agrosphere/bayer/products/agrishield-pro-1.jpg"],
  "stock": 84,
  "stockVersion": 12,
  "lowStockThreshold": 10,
  "sku": "AGS-500EC-1L",
  "rating": 4.6,
  "roleTag": "pest",
  "isActive": true,
  "archivedAt": null,
  "regulatoryClass": "restricted_use",
  "approvedLabelUrl": "https://res.cloudinary.com/agrosphere/bayer/labels/agrishield-pro-label-signed.pdf",
  "requiresApplicatorCredential": true,
  "priceBreaks": [
    { "minQty": 10, "price": 3040.00 },
    { "minQty": 50, "price": 2880.00 }
  ]
}
```

**Order** (mid-lifecycle, `processing`, with the applicator credential captured per [5.14.1](#5141-product-level-regulatory-gating))
```json
{
  "id": "ord_2a7f88",
  "tenantId": "cltn_8f2a1c",
  "customerId": "usr_7d3e19",
  "status": "processing",
  "items": [
    { "id": "oi_1", "productId": "prd_4b91c0", "bundleId": null, "name": "AgriShield Pro 500EC", "price": 3200.00, "quantity": 2 }
  ],
  "subtotal": 6400.00,
  "tax": 1088.00,
  "total": 7488.00,
  "currency": "PKR",
  "applicationFeeAmount": 32.00,
  "stripePaymentIntentId": "pi_3P9k...",
  "shippingAddress": { "line1": "Chak 42/SB", "city": "Sahiwal", "province": "Punjab", "postalCode": "57000", "country": "PK" },
  "applicatorCredentialRef": "APL-2024-88213",
  "cancelledBy": null,
  "createdAt": "2026-02-10T08:12:00Z"
}
```

**DiagnosisRequest** (a real result below the confidence floor — showing the no-product-surface path from [4.9](#49-disease-diagnosis))
```json
{
  "id": "dgn_991a4c",
  "tenantId": "cltn_8f2a1c",
  "userId": "usr_7d3e19",
  "anonymousId": null,
  "imageUrl": "https://res.cloudinary.com/agrosphere/bayer/diagnosis/dgn_991a4c-signed.jpg",
  "kindwiseResponse": { "raw": "..." },
  "status": "complete",
  "detectedDisease": "Cotton Leaf Curl Virus (suspected)",
  "confidence": 0.41,
  "belowConfidenceThreshold": true,
  "recommendedProductIds": [],
  "disclaimerAcknowledgedAt": "2026-02-11T06:30:00Z",
  "createdAt": "2026-02-11T06:31:12Z"
}
```

**SupportTicket** (a Business-tier priority ticket, showing the type/priority/SLA fields from [2.6.1](#261-support-tickets))
```json
{
  "id": "tkt_55c210",
  "tenantId": "cltn_8f2a1c",
  "type": "platform_issue",
  "priority": "priority",
  "status": "in_progress",
  "assignedTo": "plt_staff_02",
  "submittedBy": "usr_owner_bayer",
  "subject": "Chatbot not citing uploaded spec sheets",
  "createdAt": "2026-02-12T09:00:00Z",
  "slaBreachAt": "2026-02-12T13:00:00Z"
}
```

---

## 1. Marketing Site

**System:** Public, unauthenticated · root domain `agrosphere.com` (no subdomain)

> **Why this system exists.** The original design specified three systems (Super Admin, Company Dashboard, per-tenant Storefront) but left the platform's own root domain (`agrosphere.com`) essentially undefined — [5.1.1](#511-tenant-resolution-runs-first-on-every-request) only ever said it "serves the platform marketing page" with no further specification. That is a real gap for a production SaaS: this is the page that turns a prospective pesticide company into a paying tenant, the only place the $25/$50/$100 pricing is actually visible to a buyer, the only entry point into [2.2.1](#221-tenant-onboarding)'s "company applies" step, and the natural home for the legal pages (Terms of Service, Privacy Policy, DPA) referenced throughout this document but never given an actual location. It is added here as a fourth first-class system, not an afterthought.

### 1.1 Purpose & Design Direction

This is the one system in the whole product that is **not** multi-tenant — there is exactly one of it, it belongs to AgroSphere the platform operator, and its job is selling the platform itself, not selling pesticides. That distinction should be visible in the design, not just the routing:

- **Related to the product, not a clone of it, and not a generic SaaS template either.** A tenant's storefront (default-seeded from the current AgroSphere product design, [3.10](#310-storefront-cms--theme)) is warm, agricultural, product-photography-led — it's selling crop protection to farmers. The marketing site is selling **software** to business owners/operators evaluating a platform, so it leans more toward confident B2B-SaaS conventions (clear typography hierarchy, real product screenshots, a clean pricing table, explicit trust signals) than the tenant storefront does — but only *lightly*, not a wholesale switch to a generic, personality-free SaaS look. **Light theme**, and the palette/type system should still read as recognizably related to the AgroSphere product (the same green-forward brand identity from `styleGuideline.md`, [3.10.1](#3101-brand--theme-tokens)) rather than an unrelated corporate blue-and-white template — a visitor should feel "this is the company behind that product," not land on a completely disconnected brand.
- **Built for conversion, not just information.** Every page has a clear next action (See Live Demo, View Pricing, Get Started, Talk to Sales) — this is a lead-generation and self-serve-signup surface, structured accordingly rather than as a static brochure.
- **Fast and lightweight.** No tenant-resolution overhead (this is the one route tree in the entire app with zero `tenantId` context, see [1.9](#19-routing--no-tenant-context)), so it should be the fastest-loading part of the whole platform — this matters directly for conversion on a marketing site.

### 1.2 Home

The primary landing page. **CMS-editable, not hardcoded JSX** — reuses the same platform-scoped `SectionContent` pattern established for [1.7](#17-about-us)/[1.8](#18-security--trust) (`tenantId IS NULL` rows, see [0.6](#06-core-data-model)), edited by `platform_owner` at `/super-admin/settings/marketing` ([2.5.4](#254-marketing-site-content)) — this closes the ambiguity between Home and the explicitly-CMS-driven About/Legal pages; there is no hardcoded-vs-CMS split on the marketing site, all of it goes through the same platform-content mechanism. Structure:
- **Hero**: clear one-line value proposition ("The e-commerce and AI platform built for pesticide and agri-input companies"), primary CTA **"See Live Demo"** (deep-links to the public demo storefront, [5.22](#522-demo-environment)) and secondary CTA **"Get Started"** (→ [1.5](#15-signup--get-started)).
- **How it works**: a short section walking through the three things a tenant gets — their own branded storefront, a full company dashboard, and AI features (chatbot + diagnosis) — each linking to more detail rather than trying to explain the whole product on the home page.
- **Social proof / trust section**: once real tenants exist, this becomes real customer logos/testimonials (a `CustomerLogo` CMS entity, `platform_owner`-editable); at launch, it leans on the live demo itself as the trust signal ("see exactly what you'd be running, right now, no signup required").
- **Pricing teaser**: a compact 3-column summary of the tiers, **rendered from the exact same `Plan`/feature-matrix source of truth as the full [1.4 Pricing](#14-pricing) page** — never a separately hand-maintained summary, closing the same anti-drift requirement 1.4 mandates for its own table. Links through to the full page.

| Route |
|---|
| `/` |

### 1.3 Features

A dedicated deep-dive page (not just the home page's brief "How it works" section) walking through the platform's actual capabilities in enough detail for a prospective tenant to evaluate them seriously before signing up: storefront/CMS theming ([3.10](#310-storefront-cms--theme)), product/order/finance management ([3.3](#33-product-management)–[3.5](#35-order--finance-management)), field officer network ([3.6](#36-field-officers--agents-management)), the RAG chatbot ([3.11](#311-ai--rag-knowledge-base)), and image disease diagnosis ([3.12](#312-image-diagnosis-settings)). Each capability section includes an actual product screenshot or short embedded clip. **Captured, not live-embedded**: screenshots/clips are periodically re-captured static assets (uploaded to Cloudinary, refreshed as part of a release checklist whenever the underlying UI changes meaningfully), not a live iframe/embed pulling from `demo.agrosphere.com` at render time — a live embed would violate [1.11](#111-routing--no-tenant-context)'s zero-tenant-context rule for the marketing site (the demo is a real `Tenant`, and embedding it live would couple marketing-site rendering to tenant-scoped data). This means the assets can drift from the live demo's current state if not refreshed on schedule — an accepted, explicit tradeoff to keep the marketing site's own "zero tenant context" guarantee intact, rather than an unstated risk. Each section links through to "Try it in the demo" where applicable, so a visitor can always verify the real, current UI themselves. CMS-editable via the same platform-content mechanism as [1.2](#12-home).

| Route |
|---|
| `/features` |

### 1.4 Pricing

The single, authoritative, public rendering of the plan tiers already defined in [2.3.1](#231-plan-tiers) — this page must be **sourced from the same underlying plan/feature-gating data** the platform itself uses for enforcement ([2.3.1a](#231a-feature-gating-matrix)), never a hand-maintained duplicate copy that can drift out of sync with what a tenant actually gets after signing up. Concretely: the pricing page reads from the same `Plan`/feature-matrix configuration Super Admin manages in [2.5.1](#251-feature-flags-per-plan-tier), so changing a plan's price or included features in one place updates both the enforcement logic and the public marketing page.

- Full Startup / Standard / Business comparison table, matching [2.3.1a](#231a-feature-gating-matrix) exactly (including the take-rate disclosure from [2.3.1c](#231c-take-rate-on-payment-processing) — pricing transparency is a trust signal in a category this sensitive, not something to bury in fine print).
- Each tier's "Get Started" CTA carries the selected plan through to [1.5](#15-signup--get-started), pre-selecting it in the onboarding wizard.
- FAQ block addressing the questions a prospective tenant will actually have: how payments work (Stripe Connect, direct payout, [5.2](#52-payments--stripe-connect-express)), what happens on a plan downgrade, whether there's a contract/lock-in (there isn't — month-to-month, matching [2.3.1](#231-plan-tiers)'s standing upgrade/downgrade policy).
- **Version history**: every published change to plan pricing/features is versioned (same `revisionOf`/`publishedAt` mechanism as tenant CMS content, [3.10.2a](#3102a-preview--version-history)) — since a tenant's signup captures `Tenant.priceLockedAt` ([0.6](#06-core-data-model)), a dispute over "what price was shown at signup" is resolvable against this version history rather than being unauditable. See [2.3.4](#234-pricing-changes--grandfathering) for the full grandfathering policy this versioning supports.

| Route |
|---|
| `/pricing` |

### 1.5 Signup / Get Started

The actual entry point into tenant onboarding — this is where [2.2.1](#221-tenant-onboarding)'s "a prospective pesticide company applies" literally happens. A short multi-step form: company name, desired subdomain (live uniqueness check against `Tenant.subdomain`), owner name/email, business category (selected from the controlled taxonomy in [0.6](#06-core-data-model)), business registration number, regulatory self-declaration (restricted-use pesticide sales, per [5.14.3](#5143-tenant-onboarding-regulatory-review)) — the same fields [2.2.1](#221-tenant-onboarding) already specifies as collected at onboarding; this page is simply where that collection happens, not a separate data model.

**Draft persistence and resume.** Each step's input is saved server-side as a `TenantApplicationDraft` row (keyed to a signed, expiring draft token stored in a cookie — not purely `localStorage`, so the applicant can resume from a different device via an emailed "Continue your application" link if they abandon mid-flow) as soon as that step is completed, not only on final submit. A draft expires and is purged after 14 days of inactivity. This closes a real drop-off risk: the form collects meaningful data (registration number, regulatory declaration) across multiple steps, and losing all of it on an accidental tab close would be a needless conversion loss.

**Subdomain race condition.** The live uniqueness check at each keystroke is advisory, not a hold — the subdomain is only atomically claimed (via the `Tenant.subdomain` unique constraint) at actual submission time. If two applicants race for the same subdomain, the second submitter sees an immediate, clear "this subdomain was just taken — choose another" error rather than a silent failure, and their other draft data is preserved so they only need to change that one field.

**Registration number validation.** The signup form performs only basic format validation in real time (not a live registry lookup) — the actual verification against a real business registry happens at manual review time ([2.2.1](#221-tenant-onboarding) step 2), not at signup. The applicant is told explicitly at this step that registration number accuracy will be verified during review, so an applicant who enters a fabricated number is not given false real-time confidence, but the friction of live third-party registry API calls at signup time is intentionally avoided in favor of the (already-specified) manual review process.

On submit: `Tenant.status = pending`, `Tenant.pendingSince = now()` ([0.6](#06-core-data-model)), platform owner notified, applicant shown a clear "we'll review and get back to you" confirmation **plus an application-status link** (`/get-started/status?token=...`, a signed token emailed to the applicant) — the review step in [2.2.1](#221-tenant-onboarding) is real, not a formality, and an applicant who loses the confirmation email is not left with no way to check where things stand. See [2.2.1b](#221b-pending-application-sla--applicant-status-visibility) for the review-SLA policy this status page reflects, and [2.2.1c](#221c-application-rejection--reapplication) for what the status page shows on rejection.

A visible link to **"Talk to Sales instead"** ([1.6](#16-contact--sales)) is offered alongside self-serve signup, since some prospective tenants (particularly larger companies evaluating the Business tier) will want a conversation before committing.

| Route |
|---|
| `/get-started` |

### 1.6 Contact / Sales

A form (name, company, email, message — each with basic length/format validation matching the rigor applied elsewhere in this document, e.g. [3.3.2](#332-create--edit-product)'s field constraints) for prospective tenants who want to talk before signing up, and for general inquiries.

**Abuse protection.** This is a public, unauthenticated form reachable with zero tenant context, and is rate-limited per IP ([5.6](#56-rate-limiting--upstash-redis)) plus protected by a bot-filtering challenge (e.g. an invisible/low-friction CAPTCHA) on submit — closing a gap where [5.16](#516-fraud--abuse-controls) covered tenant-level and review fraud but never named marketing-site form abuse as a vector.

Submissions are filed as a **`pre_sales`-typed ticket** in the same Support Tickets system used elsewhere ([2.6.1](#261-support-tickets) — the ticket model carries an explicit `type` field distinguishing `pre_sales` / `platform_issue` / `billing` / `tenant_support` precisely so this routing claim is real, not just asserted prose, see [2.6.1](#261-support-tickets) for the full model) rather than a disconnected mailbox with no operational visibility.

| Route |
|---|
| `/contact` |

### 1.7 About Us

Company/trust content — what AgroSphere is, who operates it, why it exists. Deliberately kept as plain CMS-editable content owned by the platform owner (reusing the same structured section-content pattern as tenant CMS, [3.10.2](#3102-page--section-content-editor), scoped to the platform's own single "tenant-less" content set via the nullable-`tenantId` exception documented in [0.6](#06-core-data-model)/[0.7](#07-data-isolation-policy)) rather than hardcoded JSX. Edited at `/super-admin/settings/marketing` ([2.5.4](#254-marketing-site-content)) — the platform owner can update this copy without a code deploy.

| Route |
|---|
| `/about` |

### 1.8 Security & Trust

> Added after a review of what's missing for a "premium/modern" feel specifically — a platform asking companies to route real payments (Stripe Connect) and regulated commerce (pesticides, [5.14](#514-regulatory-compliance--pesticide-sales)) through it needs a dedicated place to make its own trust posture visible, not buried inside legal-page fine print. This is standard on any B2B-serious SaaS site and its absence was a real gap.

A single page translating the platform's actual technical/operational safeguards (already fully specified elsewhere in this document) into plain, buyer-facing language. Same CMS/editing mechanism as [1.7](#17-about-us) — `/super-admin/settings/marketing`.

- **Data isolation**: the two-layer tenant isolation model — application scoping plus database-level Row-Level Security, [0.7](#07-data-isolation-policy) — explained as "your data is never visible to another company on this platform," not in RLS/Postgres jargon.
- **Payments**: how Stripe Connect keeps a tenant's own funds flowing directly to their own account, [5.2](#52-payments--stripe-connect-express).
- **Backups & uptime**: point-in-time recovery, the public status page, [5.12](#512-backup--disaster-recovery) and [5.17](#517-sla--status-page).
- **Compliance posture**: regulatory product classification for restricted-use pesticides, [5.14](#514-regulatory-compliance--pesticide-sales), and the DPA/data-ownership model, [5.15](#515-data-ownership--gdpr-posture), each linking through to the full legal text in [1.9](#19-legal-pages).
- **AI transparency**: how the RAG chatbot and diagnosis features are grounded, disclaimed, and confidence-gated, [5.14.2](#5142-ai-advice-disclaimer--consent-policy) — relevant since a buyer evaluating the Business tier will reasonably ask "what happens if the AI gives bad advice," and this page is where that question gets a direct, honest answer rather than being left to a support conversation.

| Route |
|---|
| `/security` |

### 1.9 Legal Pages

Referenced throughout this document (tenant Terms of Service in [5.2.5](#525-tax-calculation--remittance), [5.14.2](#5142-ai-advice-disclaimer--consent-policy), [3.7.1](#371-case-study-editor); the Data Processing Agreement in [5.15](#515-data-ownership--gdpr-posture)) but never given an actual page until now — this closes that gap. These are real legal documents (drafted/reviewed by counsel, not generated content) but published here as versioned, dated pages:

- **Terms of Service** (`/terms`) — the platform-tenant agreement: the AI-liability allocation from [5.14.2](#5142-ai-advice-disclaimer--consent-policy), tax remittance responsibility from [5.2.5](#525-tax-calculation--remittance), the platform-vs-tenant support boundary from [3.9.1](#391-farmer-facing-support-channel)/[2.6.1](#261-support-tickets), and the SLA/service-credit terms from [5.17](#517-sla--status-page) all live here as the actual contractual text, not just described in this SRS.
- **Privacy Policy** (`/privacy`) — covers both the platform's own data handling and, per tenant, links out to the DPA framework from [5.15](#515-data-ownership--gdpr-posture).
- **Data Processing Agreement** (`/dpa`) — the standing controller/processor artifact from [5.15](#515-data-ownership--gdpr-posture), publicly linkable so a tenant's own legal/compliance team can review it before signup, not something exchanged only after a sales conversation.
- Each page carries a visible "Last updated" date and version — since these are the actual documents tenant ToS acceptance at signup ([1.5](#15-signup--get-started)) references, they need real version history, not silent edits.

**Editing and amendment workflow.** Managed at `/super-admin/settings/legal` ([2.5.4](#254-marketing-site-content)), `platform_owner` only. A new version is published with an effective date; a **material change** (defined as any change to the AI-liability allocation, tax responsibility, support boundary, or SLA terms — the substantive clauses named above) triggers an automated notification email (Resend) to every tenant's `tenant_owner`, since a silent material change to a binding agreement is both poor practice and a real legal-exposure risk. A cosmetic/clarifying edit does not require re-notification, but is still versioned.

| Route |
|---|
| `/terms` |
| `/privacy` |
| `/dpa` |

### 1.10 Status Page Link

Not a page hosted by this system itself — [5.17](#517-sla--status-page) already specifies a separate hosted status-page service — but the marketing site's footer links to it directly (`status.agrosphere.com` or equivalent), since uptime transparency is exactly the kind of trust signal a prospective tenant looks for before routing real payment infrastructure through a platform.

### 1.11 Routing & No Tenant Context

This is the **only** route tree in the entire application with zero tenant context — confirmed and made explicit in [5.1.1](#511-tenant-resolution-runs-first-on-every-request) step 2, which already special-cases the root domain (`agrosphere.com` with no subdomain) ahead of subdomain resolution. No `middleware.ts` tenant lookup, no RLS session variable, none of the isolation machinery in [0.7](#07-data-isolation-policy) applies here, because there is no tenant to isolate — this is genuinely global, single-instance content. The one exception remains what [5.1.1](#511-tenant-resolution-runs-first-on-every-request) already specifies: a request to `agrosphere.com/super-admin/*` performs a pure redirect to `admin.agrosphere.com/super-admin/login` rather than being treated as marketing-site content.

### 1.12 Fast-Follow: Content & Conversion Pages

Named explicitly rather than left as a silent gap — these strengthen conversion and organic acquisition but depend on content that genuinely cannot exist at MVP launch (real customers, an ongoing editorial pipeline), so they are sequenced after launch rather than blocking it:

- **Customer Case Studies (`/customers`)** — real tenant success stories, mirroring the same storytelling pattern the platform itself gives tenants for their own case studies ([3.7](#37-case-studies-management)). Blocked on having real, willing tenants to feature — the demo environment ([5.22](#522-demo-environment)) is not a substitute for a genuine customer story.
- **Blog / Resources (`/blog`)** — ongoing editorial content for organic search acquisition and thought leadership in the agri-commerce space. This is a content operations commitment, not a one-time build, so it's sequenced once there's a real content plan rather than launched as an empty placeholder.
- **Comparison pages** (e.g. "Switching from a generic storefront") — high-intent conversion content aimed at prospective tenants actively evaluating alternatives; genuinely useful but not blocking for an initial launch.

### 1.13 Marketing Site Route Map

| Route | Access | Module |
|---|---|---|
| `/` | Public | 1.2 |
| `/features` | Public | 1.3 |
| `/pricing` | Public | 1.4 |
| `/get-started` | Public | 1.5 |
| `/get-started/status` | Public (token-gated) | 1.5 |
| `/contact` | Public (rate-limited) | 1.6 |
| `/about` | Public | 1.7 |
| `/security` | Public | 1.8 |
| `/terms` | Public | 1.9 |
| `/privacy` | Public | 1.9 |
| `/dpa` | Public | 1.9 |

---

## 2. Super Admin System

**System:** Platform owner · `admin.agrosphere.com`

The control plane above every tenant. Owned by the AgroSphere operator, not by any pesticide company. Handles tenant lifecycle, platform billing, and platform-wide oversight.

### 2.1 Platform Authentication

**2.1.1 Login**
Separate credential store from tenant/customer auth — `platform_owner` and `platform_staff` only. No public signup; accounts are seeded/invited directly. Uses a **distinct NextAuth cookie name/prefix** from tenant-scoped sessions, so a tenant session structurally cannot be replayed against the platform login even under a cookie-scoping misconfiguration — see [5.1.4](#514-cookie--session-scoping-policy).

| Route | Method | Purpose |
|---|---|---|
| `/super-admin/login` | POST | NextAuth credentials sign-in, scoped to `platform_*` roles only. Rate-limited per IP and per-account — see [5.6](#56-rate-limiting--upstash-redis). |

There is exactly one canonical URL for this login. The root domain (`agrosphere.com`) performs a hard 302 redirect to `admin.agrosphere.com/super-admin/login` rather than hosting a parallel local route — a second nominally-equivalent entry point to the highest-privilege login in the system is an unnecessary attack surface.

**2.1.2 Staff Invitations**
Platform owner invites additional `platform_staff` by email; invite token expires in 72h, single-use. `platform_staff` permissions are a **single fixed profile, not configurable per invitee** — stated here explicitly rather than left implicit in the route-access table ([2.8](#28-super-admin-route-map)): every `platform_staff` account has identical access (analytics, tenant list/detail/impersonation, support, moderation) and identical exclusions (no billing, no settings, no manual tenant creation, no audit log). A future need for differentiated platform-staff permission tiers is out of scope for this version.

**2.1.3 Platform Staff Removal**
A real, previously missing CRUD operation: `platform_owner` can deactivate a `platform_staff` account from a staff list at `/super-admin/settings/staff` ([2.5](#25-global--platform-settings)). Deactivation immediately increments the target account's `sessionVersion` ([5.1.6](#516-session-freshness--revocation-policy)), invalidating any active session on the very next request — critical given `platform_staff` holds impersonation access. **If the deactivated account has an active impersonation session at the moment of removal**, that session is force-terminated immediately (not left to expire naturally at the 30-minute mark) — the impersonation token's validity is tied to its issuing account's `sessionVersion`, same mechanism as any other session. The action is written to `AuditLog`.

### 2.2 Tenant Management

**2.2.1 Tenant Onboarding**
A prospective pesticide company applies (or is manually created by the platform owner). Onboarding wizard collects: company name, desired subdomain (uniqueness-checked live), owner name/email, business category (from the controlled taxonomy in [0.6](#06-core-data-model)), **business registration number**, and **regulatory self-declaration** (does this company sell restricted-use pesticide products — see [5.14](#514-regulatory-compliance-pesticide-sales)).

1. Application submitted → `Tenant.status = pending`, `Tenant.pendingSince = now()`.
2. Platform owner reviews. Review checklist now includes:
   - **Trademark/legitimacy check** — a basic trademark-database lookup plus a rights-holder attestation, to prevent a bad actor registering a real competitor's brand name as a subdomain (phishing/counterfeit-storefront risk).
   - **Business registration verification** — the submitted registration number is checked against the real registry at review time (not at signup time — see [1.5](#15-signup--get-started)), not just self-reported, as a baseline fraud control.
   - **Regulatory flag** — if the applicant declared they sell restricted-use products, `regulatoryReviewStatus = pending` and approval requires the separate compliance step in [5.14](#514-regulatory-compliance-pesticide-sales) before those product categories can be activated (general commerce can still launch while this is pending).
3. On approval: `Tenant.status = active`, `Tenant.priceLockedAt = now()` (locks in the plan price shown at signup — see [2.3.4](#234-pricing-changes--grandfathering)), `tenant_owner` User created, invite email sent (Resend) with password-set link.
4. Tenant redirected to Stripe Connect Express onboarding (see [5.2](#52-payments--stripe-connect-express)) before they can receive real orders.
5. Default `TenantTheme`/`PageConfig`/`SectionContent` rows seeded from the current AgroSphere design (see [3.10](#310-storefront-cms--theme)), using the **versioned seed** described in [2.5.3](#253-default-content-seeds).

**2.2.1a Editing an Approved Tenant**
Not previously specified — a real missing CRUD gap. `platform_owner` can edit a tenant's core info from `/super-admin/tenants/[id]/edit` ([2.8](#28-super-admin-route-map)): `name` (legal/display name), `businessCategory`, `businessRegistrationNumber` (e.g. correcting a data-entry error found post-approval, or reflecting a real re-registration), and — as an explicit override tool for edge cases (fraud response, dispute resolution, a sales-negotiated custom deal) — `plan` directly, bypassing the normal tenant-initiated upgrade/downgrade flow in [2.3.1](#231-plan-tiers). **`subdomain` remains genuinely immutable**, even to `platform_owner` — this is not an oversight but the deliberate consequence of the "never reissued" guarantee in [0.4](#04-tenancy-model); a tenant that needs a different subdomain requires a new `Tenant` row (functionally a re-onboarding), not an edit. Every edit through this route is written to `AuditLog`.

**2.2.1b Pending-Application SLA & Applicant Status Visibility**
Not previously specified — an application could otherwise sit in `pending` indefinitely with no escalation and no applicant-facing visibility. Now:
- A `pending` application older than **5 business days** (measured from `Tenant.pendingSince`) triggers an automated reminder to `platform_owner`/`platform_staff` via the same channel as new-application notifications, and surfaces as an overdue flag in `/super-admin/tenants` (sortable/filterable by pending age).
- The applicant can check status at any time via the signed-token link from [1.5](#15-signup--get-started) (`/get-started/status?token=...`) — showing `pending` (with an honest "under review" message, no fake progress bar), `active` (redirects to their new `/dashboard/login`), or `rejected` (see [2.2.1c](#221c-application-rejection--reapplication)).

**2.2.1c Application Rejection & Reapplication**
On rejection, the applicant is notified via Resend with a reason, and their status page shows the same reason plus a **"Submit a new application"** link — a rejected applicant is not permanently blocked; they can reapply with corrected information (e.g. a fixed registration number, a different subdomain if the original was rejected for a trademark conflict). A reapplication is a new `Tenant` row in `pending` status, not a resurrection of the rejected one.

**2.2.2 Tenant List & Detail**
Searchable/filterable table: name, subdomain, plan, status, Stripe onboarding state, regulatory review status, created date, **order volume (an aggregate count, computed via the `BYPASSRLS` platform-analytics query path in [0.7](#07-data-isolation-policy) — never individual `Order` rows)**, last active, pending-age flag (see [2.2.1b](#221b-pending-application-sla--applicant-status-visibility)). Detail view drills into that tenant's own dashboard data via the impersonation flow below, or into the direct core-info edit form ([2.2.1a](#221a-editing-an-approved-tenant)) for the fields that don't require impersonation to change.

**2.2.2a Impersonation Security Model**

A prior design left "read-only impersonation" almost entirely unspecified — a real security gap given `platform_staff` (not just the owner) had access to it. The full model:

- Impersonation mints a **distinct, short-lived token** (30 minutes, non-renewable) carrying both the admin's real identity and the target tenant context. It never simply extends or reuses the admin's own session.
- Read-only is enforced **server-side**: every mutating route handler explicitly rejects any request carrying an impersonation-context token, regardless of what the UI shows or hides. A hidden button is not the security control.
- Every impersonation session — start, end, admin, tenant, duration, and a **mandatory free-text reason** — is written to the append-only `ImpersonationSession` table. This is queryable from `/super-admin/audit`.
- Impersonation tokens are excluded from any session refresh/remember-me mechanism and cannot be extended or replayed after the 30-minute expiry.
- `platform_staff` impersonation additionally sends an automatic notification email to the affected tenant's `tenant_owner` ("AgroSphere support accessed your dashboard on [date] — reason: [reason]"), both for transparency and as a natural check against casual misuse. `platform_owner` impersonation does not require this notification but is still fully logged.
- **Edge cases, stated explicitly**: (a) if the impersonating admin's own account is deactivated mid-session ([2.1.3](#213-platform-staff-removal)), the impersonation token is force-invalidated immediately, not left to expire naturally at the 30-minute mark; (b) if the target tenant is suspended while an impersonation session against it is active, impersonation continues to function in its normal read-only capacity — suspension blocks writes/new orders for the tenant's own users, it does not block a platform admin's read-only support access, since diagnosing a suspended tenant's issue is a plausible reason to be impersonating them in the first place.

**2.2.3 Suspend / Reactivate / Delete**
Suspend: `status = suspended`. The suspension wall (see [5.1.1](#511-tenant-resolution-runs-first-on-every-request)) blocks the storefront and most of the dashboard, but explicitly **exempts billing-recovery routes** (`/dashboard/login`, `/dashboard/billing`) so a suspended tenant's owner can always authenticate and resolve the underlying issue, and exempts **read-only order-fulfillment views** so in-flight orders placed before suspension can still be viewed and marked shipped/delivered by tenant staff — a farmer mid-fulfillment is never stranded by a billing dispute between the tenant and the platform. No new orders are accepted during suspension.

**Reactivate — specified, not just named.** Two distinct triggers, since suspension itself has two distinct causes (billing failure via [2.3.3](#233-invoicing)'s auto-suspend, or a manual policy-violation suspension by `platform_owner`):
- **Payment-recovery suspensions auto-reactivate.** If suspension was triggered by [2.3.3](#233-invoicing)'s dunning/auto-suspend-after-grace-period, a successful payment on the overdue invoice automatically flips `status` back to `active` and invalidates the tenant-resolution cache immediately ([5.10.1](#5101-tenant-resolution-cache)) — no manual Super Admin action required, matching how the suspension itself was automatic.
- **Policy-violation suspensions require manual reactivation.** A `platform_owner`-initiated suspension (e.g. a compliance issue, a fraud investigation) requires explicit manual reactivation by `platform_owner` from `/super-admin/tenants/[id]` — never automatic, since the underlying issue that triggered it has no automated "resolved" signal the way a payment does.

Delete: soft-delete with a 30-day recovery window before hard deletion (irreversible action, requires typed confirmation of tenant name). **Restore during the 30-day window**: `platform_owner` only, from `/super-admin/tenants/[id]` (the same detail view, which shows a "Restore" action in place of the normal action set while a tenant is in its soft-delete window) — restoring reverts `status` to its pre-delete value and cancels the scheduled hard-deletion job.

Before hard deletion completes, two distinct automated data-handling flows fire, since two distinct categories of personal data are affected:
- **Farmer data export**: every affected customer of that tenant receives an email with a link to export their own order history and account data, addressing the GDPR portability/erasure gap — see [5.15](#515-data-ownership--gdpr-posture). If a farmer's own account/email is itself inactive or the notification bounces, the export link remains valid and accessible via the same mechanism as [4.10.2](#4102-self-service-account-deletion-gdpr-erasure)'s account-deletion export for a 30-day window post-deletion, rather than being a one-time, unrecoverable notification.
- **Tenant staff data**: `tenant_owner`/`tenant_admin`/scoped-staff `User` rows are also personal data under GDPR, distinct from farmer data. These are **not** exported the way farmer data is (staff data belongs to the company being deleted, not to individual data subjects with an ongoing relationship to preserve) — staff `User` rows are hard-deleted along with the rest of the tenant's data, and staff PII is not retained post-deletion in any form (no anonymize-and-keep pattern here, unlike the farmer self-service erasure case in [4.10.2](#4102-self-service-account-deletion-gdpr-erasure), since there's no `Order`/`OrderItem` referential-integrity reason to retain a staff member's identity once the entire tenant is gone).
- **AI/document purge**: `TenantDocument`, `DocumentChunk`, and all other tenant-scoped AI data cascade-delete along with every other tenant-scoped table — stated explicitly here rather than left as an inferred consequence of "cascade delete generally," since embeddings derived from potentially-sensitive uploaded company documents are exactly the kind of data where explicit purge confirmation is a real compliance expectation, not an assumption.

The tenant's subdomain is permanently retired, never reissued (see [0.4](#04-tenancy-model)).

### 2.3 Billing & Subscriptions

> **Distinct from tenant order payments.** This module bills the *tenant company* for using the AgroSphere platform (SaaS subscription). Order payments from farmers go straight to the tenant's own Stripe Connect account and never touch platform billing — see [5.2](#52-payments--stripe-connect-express).

**2.3.1 Plan Tiers**

> **Revised after a second audit pass benchmarking against Shopify, BigCommerce, and comparable vertical SaaS pricing.** Two corrections from the original tier design: (1) gating *all* revenue visibility behind Standard actively damaged trust — a Startup tenant processing real Stripe payments could not see their own revenue, which is worse than a competitive disadvantage, it's a product-trust failure; (2) Field Officers/Nearby Help was bundled into Business alongside the two genuinely AI-cost-driven features, despite having near-zero marginal AI cost — it's a local-trust feature, not an AI feature, and belongs a tier lower.

| Plan | Price | Includes |
|---|---|---|
| Startup | $25/mo | Full customer storefront (all core pages), Product & Category Management, Order Management, **basic Finance & Revenue view (read-only — revenue over time, order count, AOV, payout status)**, **bulk CSV product import/export, order CSV export, invoice/tax PDF download, low-stock alerts, wishlist, bulk reorder** (see [3.5.3](#353-finance--revenue), [3.14](#314-bulk-operations--commerce-utilities)). Staff seats: owner + 2. |
| Standard | $50/mo | Everything in Startup, **plus** full Finance & Revenue tooling — refund workflows, dispute/chargeback management, payout reconciliation ([3.5.3](#353-finance--revenue)); Discounts & Coupons ([3.5.4](#354-discounts--coupons)); **Field Officers / Nearby Help system** ([3.6](#36-field-officers--agents-management)) — moved down from Business, since it is a local-trust feature with near-zero AI cost, not an AI feature; **abandoned cart recovery, back-in-stock notifications, product bundles/kits, group/volume pricing, tenant-visible staff audit log** ([3.14](#314-bulk-operations--commerce-utilities)). Staff seats: owner + 5. |
| Business | $100/mo | Everything in Standard, **plus** RAG-based AI Chatbot ([3.11](#311-ai--rag-knowledge-base)), Image Disease Diagnosis + product recommendation ([3.12](#312-image-diagnosis-settings)) — the two genuinely AI-cost-driven features, now the sole reason to justify this tier's premium; **advanced analytics** (cohort/retention, customer lifetime value, product-performance trend, diagnosis-to-purchase conversion funnel — see [3.13.1](#3131-advanced-analytics)); priority support with a named contact and a defined response-time SLA — see [2.6.1](#261-support-tickets). Staff seats: unlimited. |

**2.3.1c Take Rate on Payment Processing**
The platform is not flat-fee-only. In addition to the monthly plan price, a **0.5% blended fee on payment processing volume** is applied on top of Stripe's own processing fee, disclosed to tenants plainly as a separate line item at checkout-time settlement, never bundled invisibly into Stripe's fee. This corrects a structural mismatch in the original flat-fee-only design: the platform already carries variable costs that scale with tenant GMV — chargeback/dispute liability on Connect Express accounts ([5.2.1](#521-liability-model--corrected)) and AI cost exposure that spikes with real commerce activity ([5.18](#518-seasonal-capacity-planning)) — and a flat monthly fee cannot track a variable cost. This mirrors how Shopify structures its lower tiers (a modest take-rate alongside a flat subscription) rather than BigCommerce's zero-take-rate model, which only works at BigCommerce's scale and with its automatic revenue-threshold tier-forcing, neither of which fits AgroSphere at this stage. **The actual technical collection mechanism is specified in [5.2.6](#526-take-rate-collection-mechanism)** — this section states the pricing policy, 5.2.6 states how it's actually captured via Stripe's `application_fee_amount` on each destination charge.

Tenants can upgrade or downgrade at any time from `/dashboard/billing`; a downgrade that would remove access to an in-use module (e.g. Business → Standard while the chatbot is live) shows a confirmation warning and disables the module rather than deleting its data — documents, chat logs, and diagnosis history are retained and reactivate automatically on re-upgrade. An in-flight AI request (a chat stream or diagnosis call already running at the moment of downgrade) is allowed to complete; no new request is accepted post-downgrade, surfaced to the customer as a clear message ("This feature is temporarily unavailable"), never a raw error.

**Staff seat and storage quota enforcement.** Both are actively enforced, not just metered: staff seats — a new invite ([3.1.2](#312-staff-invitations)) is rejected at the API layer with a clear "seat limit reached, upgrade to add more staff" message once `Tenant.staffSeatsUsed` ([0.6](#06-core-data-model)) would exceed the plan's cap (Startup 3 total / Standard 6 total / Business unlimited, counting the owner); storage — every upload path (Product images, Case Study images, Theme assets, RAG Documents) checks `Tenant.storageUsedBytes` against the plan's cap (2GB/10GB/50GB) **before** accepting the file, rejecting with a clear over-quota message rather than accepting the upload and failing silently later. See [5.4.1](#541-storage-quota-enforcement) for the storage mechanism in full and [3.1.2a](#312a-seat-cap-enforcement) for the seat mechanism in full.

**2.3.4 Pricing Changes & Grandfathering**
Not previously addressed — a real gap, since [1.4](#14-pricing)'s pricing page reads live from the same `Plan` configuration this module manages, meaning a price change is otherwise instant and silent for every existing tenant. Policy: **existing tenants are grandfathered at their `Tenant.priceLockedAt` price** ([0.6](#06-core-data-model), set at approval per [2.2.1](#221-tenant-onboarding) step 3) for a minimum of 12 months from that date, or until they voluntarily change plans (an upgrade/downgrade re-locks the price at the then-current rate for the new plan). A platform-wide price change applies immediately only to **new** signups; existing tenants are notified via Resend of the upcoming change and the date their grandfather period ends. This mirrors standard SaaS practice (existing customers are not silently repriced) and is technically supported by [1.4](#14-pricing)'s pricing-page version history, which gives both the platform and a tenant an auditable record of what price was in effect at any given date.

**2.3.1a Feature Gating Matrix**

| Module | Startup | Standard | Business |
|---|:---:|:---:|:---:|
| Storefront (Home, Products, Cart, Precision Dose, Case Studies) | ✅ | ✅ | ✅ |
| Product & Category Management | ✅ | ✅ | ✅ |
| Order Management | ✅ | ✅ | ✅ |
| Finance & Revenue — basic view (read-only) | ✅ | ✅ | ✅ |
| Finance & Revenue — refunds, disputes, payout reconciliation | — | ✅ | ✅ |
| Bulk CSV import/export, invoice PDF, low-stock alerts, wishlist, bulk reorder | ✅ | ✅ | ✅ |
| Discounts & Coupons | — | ✅ | ✅ |
| Abandoned cart recovery, back-in-stock alerts, product bundles, group pricing | — | ✅ | ✅ |
| Field Officers / Nearby Help | — | ✅ | ✅ |
| Tenant-visible staff audit log | — | ✅ | ✅ |
| RAG AI Chatbot | — | — | ✅ |
| Image Disease Diagnosis | — | — | ✅ |
| Advanced analytics (cohort, LTV, funnel) | — | — | ✅ |
| Custom domain (fast-follow, see [5.19](#519-custom-domain--white-labeling)) | — | ✅ | ✅ |
| Tenant-facing API/webhooks (post-MVP, see [5.20](#520-tenant-api--webhook-access-post-mvp)) | — | — | ✅ |
| Field Mapping | ✅ | ✅ | ✅ |
| Staff seats | Owner + 2 | Owner + 5 | Unlimited |
| Storage (Cloudinary) | 2 GB | 10 GB | 50 GB |

Gating is enforced in two places, and the server-side check is authoritative regardless of what the client believes: route handlers and server components re-derive `Tenant.plan` from a cached-but-actively-invalidated lookup (never a value trusted from the client) before executing any gated logic; the UI additionally renders a **locked preview state** for modules above the tenant's plan (see 2.3.1b) so upgrade intent has a natural surface to convert on, rather than the module disappearing outright.

**2.3.1b Locked/Upgrade Preview State**

For Startup tenants, Finance's advanced tooling, Discounts, Field Officers/Nearby Help, and the growth-utility modules render a blurred/disabled preview with an "Upgrade to Standard" CTA. For Startup/Standard tenants, the Chatbot and Diagnosis areas remain visible (both in the dashboard nav and, where applicable, on the storefront) but render a blurred/disabled preview of the real UI with an "Upgrade to Business" CTA linking to `/dashboard/billing`. This applies to:
- `/dashboard/agents`, `/dashboard/discounts`, `/dashboard/finance` (advanced view) — locked below Standard
- `/dashboard/ai/*` — locked below Business
- `/nearby-help`, `/field-officers/[id]` (storefront) — locked below Standard
- Chatbot widget (storefront) — locked below Business, shown collapsed with an "Ask us" placeholder that opens an upgrade note instead of a chat window

No functional data is exposed in the preview state (no real agent contact info, no real chat, no real diagnosis) — it is a sales surface only, and this is enforced server-side: the preview UI never receives real data in its initial payload, since a client-side-only block would still leak data via the network tab.

**2.3.2 Usage Metering**
Per-tenant counters for: AI chat messages, diagnosis requests, staff seats, product count, storage (Cloudinary), and **GMV/payment-processing volume** (the field this section previously omitted despite [2.3.1c](#231c-take-rate-on-payment-processing) needing it — tracked via `Tenant.applicationFeeAmount` accrual across `Order` rows, see [5.2.6](#526-take-rate-collection-mechanism)). **Reset cadence**: AI usage counters (chat messages, diagnosis requests) are **monthly, resetting on the tenant's billing-cycle anniversary** — matching how the plan caps in [2.3.1a](#231a-feature-gating-matrix) are naturally understood ("your monthly diagnosis allowance"), not a lifetime total. Staff seats, product count, and storage are **running totals** (current-state counters, not period-based), since a seat or a stored file doesn't "reset" — it's occupied until explicitly freed. GMV/take-rate accrual is tracked both as a running lifetime total and a current-billing-period total, since the latter feeds the monthly platform invoice reconciliation in [2.3.3](#233-invoicing). Feeds plan-limit enforcement (via the rate-limiting layer, [5.6](#56-rate-limiting--upstash-redis)), platform revenue reporting, and the cost-anomaly alerting described in [5.11.2](#5112-ai-cost-anomaly-alerting).

**2.3.3 Invoicing**
Stripe subscription billing (platform's own Stripe account, separate from tenant Connect accounts) — monthly invoices, dunning on failed payment, auto-suspend after a grace period. **The grace period is configurable** at `/super-admin/settings/billing` ([2.5](#25-global--platform-settings)), `platform_owner` only — closing a gap where "configurable" was asserted with no stated surface. **Reactivation on payment recovery is automatic** — see [2.2.3](#223-suspend--reactivate--delete)'s Reactivate subsection, which this dunning flow feeds directly. **Platform subscription disputes/refunds**: distinct from tenant-order refunds ([6.11](#611-refund-initiation)), a tenant disputing their own AgroSphere subscription charge (e.g. billed incorrectly) is handled as a `billing`-typed support ticket ([2.6.1](#261-support-tickets)) resolved manually by `platform_owner` issuing a Stripe refund/credit against the platform's own account — no self-service refund UI for platform subscription charges, since this is a rare, judgment-call case rather than a routine commerce operation like tenant-order refunds.

### 2.4 Platform Analytics

**2.4.1 Cross-Tenant Dashboard**
Total tenants (active/pending/suspended), tenant count by plan tier (Startup/Standard/Business), total GMV processed across all tenants, platform MRR, AI usage volume and OpenAI/Kindwise cost exposure (chatbot + diagnosis calls, Business-tier only), pgvector index size/growth (infrastructure cost signal, see [0.7](#07-data-isolation-policy)), new signups over time, plan upgrade/downgrade trend, churn, dormant-tenant count (approved and Stripe-onboarded but with **fewer than 3 orders or zero dashboard logins in a trailing 30-day window** — a fraud/abuse signal, see [5.16](#516-fraud--abuse-controls); this threshold is a starting value, adjustable by `platform_owner` at `/super-admin/settings` without a spec change, but a concrete default is given here rather than left as an unset placeholder). All cross-tenant aggregates on this dashboard are computed via the `BYPASSRLS` platform-analytics query path specified in [0.7](#07-data-isolation-policy) — never a naive query under the standard tenant-scoped RLS session.

**2.4.2 Tenant Leaderboards**
Top tenants by revenue, by order volume, by AI usage — surfaces both growth opportunities and cost-risk outliers. **Time window is selectable** (trailing 7/30/90 days, or all-time), defaulting to trailing 30 days as the most operationally useful default for a monitoring tool. Computed via `groupBy`/aggregate SQL under the same `BYPASSRLS` path as 2.4.1, never a per-tenant loop, to avoid an N+1 pattern across potentially hundreds of tenants.

### 2.5 Global / Platform Settings

**2.5.1 Feature Flags per Plan Tier**
This is the **editable source of truth** for the Feature Gating Matrix in [2.3.1a](#231a-feature-gating-matrix) — the pricing page ([1.4](#14-pricing)) and the enforcement logic both read from what's configured here, stated explicitly rather than left as an inferred relationship. Two distinct kinds of value are editable, not just boolean module toggles: (a) **module availability** per plan (boolean — e.g. "is the RAG Chatbot available on Standard"), and (b) **numeric plan limits** (staff seat caps, storage GB caps, AI usage caps) — both are part of the same "feature-matrix configuration" [1.4](#14-pricing) already claims to read from, so both must live here for that claim to be true. A change here takes effect for enforcement immediately; a change to *pricing* specifically additionally triggers the grandfathering flow in [2.3.4](#234-pricing-changes--grandfathering).

**2.5.2 Platform Announcements**

| Field | Notes |
|---|---|
| title | Required, short (80-char guidance limit — banner space is limited). |
| body | Required, plain text (no rich text — consistent with the platform's "no rich-text editor" pattern elsewhere, e.g. [3.10.2](#3102-page--section-content-editor)). |
| severity | `info` (blue, dismissible, e.g. a feature announcement) / `warning` (amber, dismissible, e.g. upcoming maintenance) / `critical` (red, non-dismissible until the end date passes, e.g. an active incident). |
| startDate, endDate | Required — a banner outside this window is not rendered even if `isActive = true`, so a scheduled maintenance notice doesn't need manual removal after the fact. |
| targetPlan | Optional — `null` (all tenants) or a specific plan tier (e.g. Business-only, for an AI-vendor-specific notice). |
| isActive | Boolean — a manual override to pull a scheduled banner early. |

CRUD: create/edit/delete/schedule, all `platform_owner`/`platform_staff`. Cross-linked with the public status page ([5.17](#517-sla--status-page)) for anything severity `warning` or above — a `critical` announcement is posted to both surfaces simultaneously, not just the dashboard banner.

**UI states**: multiple simultaneous active announcements stack (most severe first, `critical` always pinned above `warning`/`info`) rather than only the newest one showing — a tenant should never miss a `critical` notice because a lower-severity one was posted more recently.

**2.5.3 Default Content Seeds**
The master copy of the current AgroSphere design/copy used to seed every new tenant's `SectionContent`/`TenantTheme` — editable only by the platform owner. Seed content is **versioned** (`seedVersion` field); editing the master template does not retroactively change already-onboarded tenants who haven't customized a section, and a new tenant onboarding during a `SectionContent` schema migration always seeds against the currently-deployed schema version, never a stale shape.

**2.5.4 Marketing Site Content**
The missing edit surface for [1.2](#12-home) (Home), [1.3](#13-features), [1.7](#17-about-us) (About), [1.8](#18-security--trust) (Security), and [1.9](#19-legal-pages) (Legal) — all of which are CMS-driven via the platform-scoped `SectionContent` exception ([0.6](#06-core-data-model)) but previously had no stated Super Admin route to actually edit them. `/super-admin/settings/marketing`, `platform_owner` only for Legal Pages specifically (given the "drafted/reviewed by counsel" requirement in [1.9](#19-legal-pages)); `platform_owner` or `platform_staff` for the lower-stakes Home/Features/About/Security content.

### 2.6 Support & Moderation

**2.6.1 Support Tickets**
Tenants (and prospective tenants, via [1.6](#16-contact--sales)) raise issues; platform staff triage/respond here. Tickets are explicitly scoped: **platform issues** (bugs, outages, billing) are handled here; **tenant-farmer issues** (order complaints, product defects) are the tenant's own responsibility via the farmer-facing support channel in [3.9.1](#391-farmer-facing-support-channel) — this line is stated explicitly in the tenant Terms of Service to avoid the ambiguity a prior design left open.

**Ticket model**: `type` (`pre_sales` / `platform_issue` / `billing` / `tenant_support`, set at creation — this is the field [1.6](#16-contact--sales) depends on to route pre-sales inquiries distinctly), `status` (`open` → `in_progress` → `resolved` → `closed`, plus `reopened` if a resolved ticket sees new activity), `priority` (`normal` / `priority` — `priority` reserved for Business-tier tenants' named-contact support, the actual backing mechanism for the "priority support" feature sold in [2.3.1](#231-plan-tiers)), `assignedTo` (a `platform_staff` member), submitter, subject, body, thread of replies.

**SLA**: first-response targets are **24 business hours for `normal` priority, 4 business hours for `priority`** (Business-tier) — concrete numbers given here specifically because "priority support" is a sold, paid differentiator that needs a real backing commitment, not just a label. SLA breach is surfaced as a flag in the ticket queue, not silently missed.

**Tenant-facing visibility**: a tenant can see their own ticket's status and reply thread from `/dashboard/support` ([3.15](#315-company-dashboard-route-map)) — one-directional visibility (submit + read replies) was a real gap in the prior design; this closes it.

**2.6.2 Content Moderation**

Moderation is **pre-publish for first-time tenant content, not purely reactive**. A prior design let a document go `processing → ready` and become immediately servable by the chatbot the moment embedding finished, with no gate before a tenant's document (potentially containing incorrect dosage or mixing instructions) could start answering farmer questions.

- **First document from a new tenant**: after embedding completes, the document enters `TenantDocument.status = pending_review`. An automated policy/safety classifier (a lightweight LLM-based scan checking for off-label mixing instructions, contradicted dosage guidance, or clearly unrelated/spam content) runs before the document can go `ready`. A clean scan auto-approves; a flagged scan routes to a human platform-staff review queue with a **target SLA of 1 business day** (given here as a concrete number, matching the "most documents auto-approve within minutes" framing for the common case — the flagged/exception path gets its own stated commitment rather than an open-ended wait, since a new Business-tier tenant's chatbot readiness depends on it). This keeps the self-serve onboarding fast while closing the zero-review-window gap.
- **Subsequent documents from an already-reviewed tenant**: go live immediately (`processing → ready`) as originally designed, since the tenant has an established trust baseline, but remain subject to ongoing automated scanning.
- **2.6.2a Moderation Rejection & Resubmission**: if human review fails a flagged document, `TenantDocument.status = rejected` (a distinct terminal state from `failed`, which means a pipeline error, not a moderation judgment — see [0.6](#06-core-data-model)). The tenant is notified via Resend with the rejection reason and can upload a corrected version, which enters the pipeline as a new document and goes through the same `pending_review` gate again (a rejected document's specific `TenantDocument` row is not reusable/editable in place).
- **Real-time anomaly detection on live chatbot output**: independent of document review, the chat log pipeline ([3.11.4](#3114-chat-log-viewer)) runs the same safety classifier against generated answers (not just source documents) and flags any response suggesting off-label chemical mixing or dosage contradicting the tenant's own configured dosage data ([3.8](#38-dosage-calculator-configuration)) for immediate platform-staff review — this is the fast kill-switch for content that slips through document-level review.
- Storefront content (case studies, product descriptions) uses the same flag/review queue for post-publish moderation, since that content is lower-risk (marketing copy) than instructional AI output.

### 2.7 Audit Log

**2.7.1 Platform Audit Trail**
Every sensitive platform action — tenant approval/suspension/deletion, plan changes, impersonation sessions, staff role changes — is written to the `AuditLog` table (see [0.6](#06-core-data-model)) and viewable at `/super-admin/audit`, filterable by actor, tenant, and action type. This is the evidentiary record referenced throughout this document wherever "logged" appears.

### 2.8 Super Admin Route Map

| Route | Access | Description |
|---|---|---|
| `/super-admin/login` | Public | Platform login. |
| `/super-admin` | platform_owner, platform_staff | Platform analytics dashboard. |
| `/super-admin/tenants` | platform_owner, platform_staff | Tenant list. |
| `/super-admin/tenants/[id]` | platform_owner, platform_staff | Tenant detail / impersonation launch / restore-from-soft-delete. |
| `/super-admin/tenants/[id]/edit` | platform_owner only | Edit an approved tenant's core info — see [2.2.1a](#221a-editing-an-approved-tenant). |
| `/super-admin/tenants/new` | platform_owner | Manual tenant creation. |
| `/super-admin/billing` | platform_owner | Platform subscription/invoicing overview. |
| `/super-admin/settings` | platform_owner | Global settings, feature flags, default content seeds, dunning grace-period config. |
| `/super-admin/settings/staff` | platform_owner | Platform staff list, invite, and removal — see [2.1.3](#213-platform-staff-removal). |
| `/super-admin/settings/marketing` | platform_owner, platform_staff (Legal Pages restricted to platform_owner) | Marketing Site content editing — see [2.5.4](#254-marketing-site-content). |
| `/super-admin/support` | platform_owner, platform_staff | Ticket inbox — see [2.6.1](#261-support-tickets) for the lifecycle/SLA model. |
| `/super-admin/moderation` | platform_owner, platform_staff | Pending-review documents/content queue, chatbot-output anomaly flags. |
| `/super-admin/audit` | platform_owner only | Full platform audit log, including impersonation history. |

---

## 3. Company Dashboard

**System:** Tenant admin · `{tenant}.agrosphere.com/dashboard`

Every module a pesticide company needs to run its storefront: products, categories, orders, finance, field agents, case studies, the dosage calculator, customers, CMS/theme, and AI configuration. Fully scoped to the logged-in staff member's `tenantId` under the two-layer isolation policy in [0.7](#07-data-isolation-policy).

### 3.1 Tenant Auth & Staff Management

**3.1.1 Staff Roles**

Modeled on standard e-commerce/SaaS back-office role separation — each scoped role sees only its own modules in the dashboard nav; every other module is absent, not just locked. A single staff account may hold multiple roles (`User.roles[]`, see [0.6](#06-core-data-model)); nav visibility is the **union** of all roles a user holds, not a single primary role.

| Role | Access |
|---|---|
| tenant_owner | Full access, including Stripe settings and removing other staff. One per tenant, set at onboarding. |
| tenant_admin | Full access except Stripe/billing settings and owner transfer. |
| order_manager | Orders ([3.5.1](#351-order-lifecycle), [3.5.2](#352-order-list--detail)) + Discounts & Coupons ([3.5.4](#354-discounts--coupons)). View/update order status, manage coupons. No finance data, no product edits, no settings. |
| finance_manager | Finance & Revenue only ([3.5.3](#353-finance--revenue)) — basic revenue view available at every plan; refunds, disputes, and payout reconciliation tooling are Standard+ plan features. Cannot change order status or edit products. |
| product_manager | Products, Categories, Dosage Calculator Config ([3.3](#33-product-management), [3.4](#34-category-management), [3.8](#38-dosage-calculator-configuration)). Catalog and stock management. No order or finance visibility. |
| content_manager | Storefront CMS/Theme, Case Studies ([3.10](#310-storefront-cms--theme), [3.7](#37-case-studies-management)). Editing storefront copy, branding, and case studies. No commerce access at all. |

**3.1.2 Staff Invitations**
Owner/admin invites by email + assigns one or more roles from 3.1.1. Invite email via Resend, 72h expiry, single-use, accept flow sets password via NextAuth credentials. **Pending invitations are listed** (alongside active staff, at `/dashboard/staff`) with **cancel** and **resend** actions — a real, previously-missing CRUD gap (an invite sent to a mistyped or unresponsive email had no correction path).

**3.1.2a Seat Cap Enforcement**
Startup (owner + 2), Standard (owner + 5), Business (unlimited) — see [2.3.1a](#231a-feature-gating-matrix). `Tenant.staffSeatsUsed` ([0.6](#06-core-data-model)) counts active staff `User` rows (owner included); a new invite is rejected at the API layer with a clear "seat limit reached — upgrade to Standard/remove a staff member to invite" message once the cap would be exceeded, checked before the invite email sends, not after. A cancelled/expired pending invite does not count against the cap; an accepted invite does.

**3.1.3 Login**

| Route | Method |
|---|---|
| `/dashboard/login` | POST |

Resolves tenant from subdomain first, then authenticates within that tenant's user pool (per the `(email, tenantId)` uniqueness scope in [0.6](#06-core-data-model)) — a staff login on `bayer.agrosphere.com/dashboard/login` can only authenticate Bayer's own staff accounts. Rate-limited per IP and per-account — see [5.6](#56-rate-limiting--upstash-redis).

**3.1.3a Self-Service Profile**
`/dashboard/account` ([3.15](#315-company-dashboard-route-map)) — every staff role (not just owner/admin) can view/edit their own name, change their own password, and enroll in MFA (mandatory prompt for `tenant_owner` per [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts)) from a self-service route, distinct from the admin-managing-others routes elsewhere in this section. This closes a gap where every route in 3.1 was framed as admin-managing-staff with no self-service surface for a staff member's own account.

**3.1.4 Role Change & Removal**
When an owner/admin changes a staff member's roles or removes them entirely, `User.sessionVersion` is incremented, which invalidates that user's active database session on their very next request (see [5.1.6](#516-session-freshness--revocation-policy)) — a demoted or removed staff member cannot continue acting under their old permissions for any window of time. The action is written to the platform `AuditLog`.

**3.1.4a Staff Attribution After Removal**
A removed staff member's historical actions (order status changes, refunds issued, products edited, audit log entries) remain fully attributable: `AuditLog.actorNameSnapshot` ([0.6](#06-core-data-model)) captures the acting staff member's name **at write time**, so a later `User` removal never produces an orphaned or blank attribution in the tenant's audit log ([3.14.11](#31411-tenant-visible-staff-audit-log)) — the historical record shows who did what, even if that person no longer has an account.

**3.1.5 Ownership Transfer**
Not previously specified — a real gap for a role described as "One per tenant, set at onboarding" with no stated succession path. `tenant_owner` can transfer ownership to any existing `tenant_admin` from `/dashboard/staff` (requires the *current* owner's MFA confirmation, given the sensitivity of this action). The outgoing owner is automatically demoted to `tenant_admin` (not removed) — ownership transfer is a role swap between two existing staff accounts, not a staff-removal event. If an owner leaves the company with no `tenant_admin` to promote, this requires `platform_owner` intervention via impersonation-adjacent support action (a manual account-recovery process, since there is no automated "owner is unreachable" detection).

### 3.2 Onboarding & Setup Checklist

First-login guided checklist shown on `/dashboard/setup`, **adapted to the tenant's actual plan tier** — this is now stated explicitly in this module's own spec, not left to be inferred only from the [6.2](#62-tenant-onboarding-start-to-first-sale) flow narrative (a prior gap: a Startup-tier tenant could never complete a checklist that unconditionally listed Field-Officer and RAG-document steps, since those modules are locked below Standard/Business). Steps, conditional by plan:
- **Every plan**: connect Stripe → add first product/category → upload logo/brand colors.
- **Standard or Business only**: add first field officer.
- **Business only**: upload first RAG document.

Dashboard home shows setup completion % against the tenant's **actual applicable step count** (3 for Startup, 4 for Standard, 5 for Business) — never against a fixed 5-step count a lower tier could never complete. The checklist can be dismissed permanently once its applicable steps are done, or manually dismissed early by `tenant_owner`/`tenant_admin` if the tenant chooses not to complete a step.

### 3.3 Product Management

**3.3.1 Product List**
Searchable/filterable (by category, stock status, active/inactive, regulatory class) table with bulk actions (activate/deactivate/archive/**restock**). Backed by composite indexes on `(tenantId, category, isActive)` and `(tenantId, stock)` to avoid full-table scans as catalogs grow. **Restock** is a dedicated quick action (a stock-quantity input, applied directly) distinct from opening the full edit form — the previous design only offered stock adjustment via full product edit, a real friction gap for the common "received a new shipment, update quantities" operation.

**Archive, not hard-delete, when order history exists.** "Delete" on a product is a soft-delete/archive state (`Product.archivedAt`, distinct from `isActive = false`, which is a simple storefront-visibility toggle a tenant can reverse at will) — matching the pattern Shopify and comparable commerce platforms use rather than a real `DELETE`. A product with any `OrderItem` referencing it is **never hard-deleted**: `OrderItem` already stores a name/price snapshot at time of purchase ([0.6](#06-core-data-model)), so a historical order remains fully readable and accurate even after the underlying `Product` is archived, but the referential integrity of that link is preserved rather than silently relying on the snapshot alone with a dangling foreign key. A product with zero order history can be hard-deleted freely, since nothing depends on it.

**UI states**: **empty state** (brand-new tenant, zero products) shows the setup-checklist prompt to add a first product ([3.2](#32-onboarding--setup-checklist)) rather than a bare table; **all-archived state** (every product archived, none active) shows a distinct message from "no products at all," since these represent different tenant situations (a catalog wind-down vs. a never-populated one); a **low-stock row** is visually flagged inline (a colored indicator, not just a separate alert elsewhere) so the signal is visible while browsing the list, not only in the dashboard-home widget.

**3.3.1a Stock Decrement & Concurrency Control**

> Previously entirely unspecified — the most severe gap found in a re-audit of this module. This closes it with a named, standard e-commerce concurrency pattern.

- **When stock decrements**: at `Order.status = payment_confirmed` (the Stripe webhook-driven transition, [6.6](#66-order-lifecycle-farmer-to-fulfillment) step 2) — **not** at `pending`/checkout-session-creation. Decrementing only on confirmed payment avoids reserving stock against carts that never complete payment, at the cost of a real overselling risk during the gap between "Checkout Session created" and "webhook confirms" — closed by the mechanism below, not by reserving stock early.
- **Atomic, race-safe decrement**: the decrement is a single conditional `UPDATE Product SET stock = stock - :qty, stockVersion = stockVersion + 1 WHERE id = :productId AND stock >= :qty` (an atomic compare-and-decrement, not a read-then-write from application code) — `Product.stockVersion` ([0.6](#06-core-data-model)) is the optimistic-concurrency counter that makes concurrent decrements on the same row safe under Postgres's default read-committed isolation. If the `UPDATE` affects zero rows (stock insufficient at the moment of confirmation — the classic two-farmers-last-unit race), the order transitions to a new side-state, `payment_confirmed_oversold`, rather than silently succeeding with negative stock or silently failing — see [6.16](#616-checkout-time-stock-unavailability) for the full farmer-facing and tenant-facing handling of this state.
- **Database-level backstop**: a `CHECK (stock >= 0)` constraint on `Product.stock` as a second, database-enforced guarantee that no code path — including a future bug — can ever drive stock negative, mirroring the two-layer defense-in-depth philosophy already established for tenant isolation in [0.7](#07-data-isolation-policy).
- **Cancellation/refund restores stock**: a `cancelled` or `refunded` order (see [3.5.1a](#351a-order-status-transition-rules), [6.11](#611-refund-initiation)) atomically restores the decremented quantity via the same `stockVersion`-guarded update pattern, applied in reverse.

**3.3.1b Low-Stock Threshold Configuration**
`Product.lowStockThreshold` ([0.6](#06-core-data-model)) — an optional per-product override; if unset, falls back to a **tenant-level default threshold** (a new field, `Tenant.defaultLowStockThreshold`, int, default `5`), configurable at `/dashboard/settings` or inline on the product edit form. This closes a gap where "configured stock threshold" was referenced by [3.14.4](#3144-low-stock-alerts) with no actual field or config surface anywhere in the schema.

**3.3.2 Create / Edit Product**

| Field | Notes |
|---|---|
| name, description | Rich enough for storefront display. **Minimum 1 image, minimum 20-word description** — concrete values given here rather than "a basic gate" left unquantified. |
| price, currency | Decimal + explicit currency, see [0.8](#08-localization--currency). |
| category | Select from tenant's own categories ([3.4](#34-category-management)). |
| images[] | Cloudinary upload, multiple; minimum one image enforced as stated above. |
| stock | Integer — required for real commerce. See [3.3.1a](#331a-stock-decrement--concurrency-control) for decrement mechanics. |
| lowStockThreshold | Optional per-product override — see [3.3.1b](#331b-low-stock-threshold-configuration). |
| sku | Optional internal reference code. **Unique per tenant when set** (nullable, but non-null values are enforced unique via a partial unique index `WHERE sku IS NOT NULL`) — closes a prior gap where nothing prevented duplicate SKUs. |
| role tag | `pest` / `fungal` / `growth` / `weed` / `unknown` — drives cart smart-tagging and diagnosis→product matching (carried over from existing `deriveTagsFromCategory` logic). A suggested/controlled vocabulary is offered (not enforced) to keep cross-tenant diagnosis-matching quality consistent, since this tag directly drives [4.9](#49-disease-diagnosis)'s recommendation accuracy. |
| isActive | Hide from storefront without deleting. Cannot be set `true` for a `restricted_use` product without a non-null `approvedLabelUrl` — see [5.14](#514-regulatory-compliance-pesticide-sales). |
| regulatoryClass | `general_use` / `restricted_use` — see [5.14](#514-regulatory-compliance-pesticide-sales). |
| approvedLabelUrl | Structured label document upload (Cloudinary, signed), distinct from the free-text `description` — required for `restricted_use`, surfaced verbatim on the public product page. |
| requiresApplicatorCredential | Boolean — if set, checkout captures an applicator license reference for this line item, see [5.14](#514-regulatory-compliance-pesticide-sales). |

**Regulatory standing revocation cascade.** If a tenant's `regulatoryReviewStatus` is later reset (e.g. a compliance issue found post-approval — see [5.14.3](#5143-tenant-onboarding-regulatory-review)), every one of that tenant's `restricted_use` products with `isActive = true` is automatically deactivated (`isActive = false`) as part of the same status-change transaction, and the tenant is notified via Resend — closing a gap where an already-approved restricted product had no stated deactivation path if the tenant's underlying regulatory standing changed.

**3.3.3 Reviews Moderation**
View/hide/**delete**/**restore** customer reviews attached to a product, plus a **tenant response** (a public seller reply, `ProductReview.tenantResponse`, [0.6](#06-core-data-model)) — closing a gap where the only stated actions were view/hide, with no delete, no restore, and no reply capability despite this being a standard e-commerce review-management pattern (Amazon/Shopify seller responses).

**3.3.3a Review Integrity**
Reviews are gated to **verified purchasers only** — a review can only be submitted against an `Order` where `status = delivered` for that specific product, closing a fake-review-fraud gap. Review submission is rate-limited per customer per product (reusing the existing Upstash rate-limiting infrastructure), and unusual rating velocity on a product is flagged into the moderation queue ([2.6.2](#262-content-moderation)) as a possible manipulation signal.

### 3.4 Category Management

**3.4.1 Category List & Fields**

| Field | Notes |
|---|---|
| name | Required. **Unique per tenant** (case-insensitive uniqueness check — "Fungicides" and "fungicides" collide). |
| description | Optional, plain text, shown on the storefront category-filter tooltip. |
| icon | Required — a lucide icon name selected from a fixed picker (not free text), matching the current storefront pattern. |
| image | Optional, Cloudinary upload, shown on the storefront category grid. |
| productCount | Read-only, computed — number of active (non-archived) products currently assigned, shown in the list view so a tenant can see at a glance which categories are populated vs. empty. |

Categories are tenant-owned (not shared/global) at MVP — each company builds its own taxonomy, explicitly **flat, no nesting/hierarchy** at MVP (a deliberate scope decision, stated here explicitly rather than left to be inferred from the absence of a `parentCategoryId` field).

**3.4.2 Create / Edit / Delete**
Create and edit share one form (the fields above). **Category deletion with products assigned**: a category with any `Product` referencing it **cannot be hard-deleted** — the delete action is blocked with a clear message ("N products use this category — reassign or archive them first") rather than silently cascading (which would orphan products) or silently blocking with no explanation. A category with zero assigned products (including archived ones, since `Category` is still a live FK target for archived `Product` rows) can be deleted freely. This mirrors the same "archive over hard-delete when referenced" philosophy already established for Products ([3.3.1](#331-product-list)), applied at the category level.

**3.4.3 UI States**
- **Empty state** (zero categories, e.g. immediately after tenant onboarding): a prompt card ("Create your first category to start organizing products") with a direct "Add Category" CTA, rather than a blank table.
- **Delete-blocked state**: the blocked-delete message names the specific product count and links directly to a pre-filtered product list (`/dashboard/products?category=X`) so the tenant can act on the reassignment immediately, not just receive a passive error.

### 3.5 Order & Finance Management

> This module does not exist today in any form — the current storefront cart is ephemeral, client-only mock state with no persistence. This is the first real order system for the product.

**3.5.1 Order Lifecycle**

```
pending → payment_confirmed → processing → shipped → delivered
```

Side states: `payment_failed`, `cancelled`, `refunded`, `disputed`, **`payment_confirmed_oversold`** (see [3.3.1a](#331a-stock-decrement--concurrency-control) and [6.16](#616-checkout-time-stock-unavailability)) — reachable from `pending`/`payment_confirmed`/`processing`/`delivered`/`payment_confirmed` respectively. `disputed` is entered automatically on a Stripe `charge.dispute.created` webhook — see [5.2.2](#522-dispute-chargeback--reserve-policy).

**3.5.1a Order Status Transition Rules**

> Previously unspecified — a staff member could plausibly jump straight from `pending` to `delivered` in the dashboard UI, which matters because downstream logic (review eligibility, [3.3.3a](#333a-review-integrity)) depends on `delivered` genuinely meaning the order was fulfilled through the real sequence.

The dashboard status-change control only ever offers the **next valid state(s)** for the order's current status — never an arbitrary jump. Valid transitions:

| From | To (staff-initiated) | To (system-initiated) |
|---|---|---|
| `pending` | `cancelled` (staff or customer, see [3.5.1b](#351b-farmer-initiated-cancellation)) | `payment_confirmed` / `payment_failed` (Stripe webhook) |
| `payment_confirmed` | `processing`, `cancelled` (pre-shipment only) | `disputed` (Stripe webhook), `payment_confirmed_oversold` (stock check failure) |
| `processing` | `shipped`, `cancelled` (pre-shipment only) | `disputed` |
| `shipped` | `delivered` | `disputed` |
| `delivered` | *(terminal for staff actions; refund is a separate action, not a status "transition" — see [6.11](#611-refund-initiation))* | `disputed` |

Any transition not in this table (e.g. `pending` → `delivered` directly) is rejected at the API layer, not just hidden in the UI — matching the enforcement philosophy already established elsewhere in this document (role checks, plan gating) of never relying on the UI alone as the only gate.

**3.5.1b Farmer-Initiated Cancellation**

> Previously entirely absent — only staff-initiated refund existed. A standard, expected e-commerce capability, now specified.

A farmer can cancel their own order from `/profile` while it is `pending` or `payment_confirmed` **and not yet `processing`** — once a tenant has begun fulfillment, cancellation becomes a staff-mediated action (the farmer can request it via the tenant support channel, [3.9.1](#391-farmer-facing-support-channel), but cannot self-cancel past that point, since the tenant may have already committed physical/logistics resources). A successful self-cancellation: reverses payment via Stripe refund (same mechanism as [6.11](#611-refund-initiation)), restores stock ([3.3.1a](#331a-stock-decrement--concurrency-control)), sets `Order.status = cancelled` with `cancelledBy = customer` ([0.6](#06-core-data-model)), and notifies tenant staff.

**3.5.1c Partial Shipment — Explicitly Out of Scope at MVP**

Confirmed structurally unsupported by the current schema (`Order.status` is a single top-level enum, not per-line-item) — rather than leave this as a silent gap, it is named here as a **deliberate MVP scope decision**: split/staggered fulfillment (some items ship, others backorder) is not supported. An order ships as a single unit; if a tenant cannot fulfill part of an order, the standard path is to cancel/refund the unavailable line item(s) pre-shipment (via [6.11](#611-refund-initiation)'s partial-refund capability) rather than partially shipping. This is flagged as a real limitation for the target market specifically — agri-input buying is often seasonal/bulk ([3.14.6](#3146-bulk-reorder), [5.21.5](#5215-group-buying-at-cooperative-scale)), exactly the kind of commerce where partial fulfillment is common — and named as a **Phase 2 schema change** (would require `OrderItem.status` or a dedicated `Shipment` entity, not just new UI) rather than a near-term fast-follow, since it's a structural change, not a surface one.

**3.5.1d Manual Order Entry**
A `product_manager` or `order_manager` can create an order on a farmer's behalf from `/dashboard/orders/new` — covering phone/offline orders, common for B2B agri distributors and relevant given the target market's lower-digital-fluency segments ([5.21.2](#5212-whatsapp-commerce-integration), [5.21.3](#5213-voice-input-for-the-chatbot)). A manually-created order requires selecting or creating the customer record, follows the same stock-decrement mechanics as a self-checkout order, and payment is captured either via a Stripe-hosted payment link sent to the farmer, or marked `payment_confirmed` manually for an off-platform payment arrangement (e.g. cash/bank transfer) with a required staff note explaining the payment method — this keeps the same `Order`/`OrderItem` model serving both self-checkout and staff-entered orders without a parallel data structure.

**3.5.2 Order List & Detail**
Filterable by status/date/customer, backed by a composite index on `(tenantId, status, createdAt)` matching this exact query shape. Detail view: line items, customer info, shipping address, payment status (from Stripe), applicator credential reference (if applicable), **internal notes** (free text, timestamped and attributed to the writing staff member — same `actorNameSnapshot` attribution pattern as [3.1.4a](#314a-staff-attribution-after-removal), visible to any staff role with access to that order, editable/deletable only by the original author or `tenant_owner`/`tenant_admin`), status-change actions constrained to [3.5.1a](#351a-order-status-transition-rules)'s valid-transition table, with customer email notification on each transition (Resend + Inngest, deduplicated per [5.2.4](#524-webhook-idempotency--deduplication)).

**UI states**: the default list view opens filtered to **non-terminal statuses** (`pending` through `shipped`) rather than showing all-time history unfiltered — the actionable orders a tenant needs to act on today, with a separate "All Orders" toggle for full history; `payment_confirmed_oversold` orders ([6.16](#616-checkout-time-stock-unavailability)) are surfaced with a distinct, high-visibility flag at the top of the list regardless of the active filter, since they require staff attention immediately.

**3.5.3 Finance / Revenue**
Split by plan tier — every tenant, including Startup, gets visibility into their own money; only the operational *tooling* on top of that data is gated:
- **Basic view (every plan)**: revenue over time, order count, average order value, payout status. Read-only. A refunded order **is** correctly netted out of this basic view's revenue figure even for a Startup tenant who cannot themselves *initiate* a refund — the read view always reflects actual settled state, regardless of which plan tier has the tooling to cause that state change (a Startup tenant's refund, if one occurs via platform-staff-assisted support, still shows correctly).
- **Standard+ tooling**: top-selling products trend, refund initiation, **dispute/chargeback log** with response-deadline tracking (Stripe disputes carry a fixed 7–21 day response window — see [5.2.2](#522-dispute-chargeback--reserve-policy)), payout reconciliation.
- **Payout cadence**: inherited from the tenant's own Stripe Connect Express account settings (Stripe's default is daily/rolling, tenant-configurable directly in their Stripe Express dashboard, not through AgroSphere's own dashboard) — stated explicitly here so "payout status" in the basic view is understood as reflecting Stripe's own schedule, not an AgroSphere-controlled one.

Numbers sourced from Stripe Connect account data (that tenant's own account) combined with the local `Order` table.

**3.5.4 Discounts & Coupons**

| Field | Notes |
|---|---|
| code | Required, unique per tenant, case-insensitive (`HARVEST10` and `harvest10` are the same code). Auto-uppercased on save for display consistency. |
| type | `percentage` / `fixed`. |
| value | Decimal — a percentage (0–100) or a fixed currency amount depending on `type`. Validated against `type` (a `percentage` value over 100 is rejected). |
| usageLimitGlobal | Optional integer — total redemptions across all customers before the code deactivates automatically. |
| usageLimitPerCustomer | Optional integer — defaults to 1 (a coupon is typically single-use per customer unless explicitly set higher). |
| minimumOrderValue | Optional decimal — code is rejected at checkout if cart subtotal is below this. |
| scope | `store_wide`, or `products` / `categories` (with an accompanying list of specific IDs) — restricts which line items the discount applies to. |
| startDate, expiryDate | Optional — a code with no `startDate` is active immediately; a code past `expiryDate` is rejected at checkout with a clear "this code has expired" message, not a silent no-op. |
| isActive | Boolean — a manual kill switch, independent of usage limits/expiry, for a tenant to pull a code immediately (e.g. it leaked publicly). |

**Stacking rule with volume pricing**: a discount code and a [3.14.10](#31410-group--volume-pricing) price-break are **mutually exclusive on the same line item** — whichever gives the farmer the better price applies, they do not compound. This is stated explicitly here since both features exist simultaneously at Standard+ and an unstated interaction would be a real checkout-math bug waiting to happen.

**UI states**: an invalid/expired/exhausted code entered at checkout shows an inline, specific reason ("This code has expired" / "This code has reached its usage limit" / "Code not found") rather than a single generic "invalid code" message — each failure mode is distinguishable so a farmer isn't left guessing why a code that clearly exists didn't work.

### 3.6 Field Officers / Agents Management

Manages the field-officer directory — the agricultural consultants a farmer discovers on the storefront's Nearby Help map. Currently a hardcoded array (`data/experts.ts`) in the existing codebase; becomes a real, multi-tenant-aware data model.

> **Multi-tenant design decision.** A field officer is a real independent professional (an agronomist/consultant) who commonly works with more than one pesticide company — this is not modeled as a plain tenant-owned table like Products or Case Studies. The identity (`Officer`) is a single, platform-level row; each tenant that lists that officer creates its own `OfficerTenantListing` row linking to it. This avoids duplicate, drifting profiles for the same real person across companies while keeping every farmer-facing query strictly scoped per tenant. See [0.6](#06-core-data-model) for the full entity split.

**3.6.1 Officer Identity vs. Tenant Listing**

| Layer | Owned by | What it holds |
|---|---|---|
| `Officer` (identity) | Platform — created once, referenced by every tenant that lists this person | name, image, phone, whatsapp, experience, specializations[], a platform-level `platformVerified` flag (separate from any tenant's own trust badge) |
| `OfficerTenantListing` (per-tenant listing) | Tenant — this is the row every dashboard and storefront query actually filters `WHERE tenantId = current` on | role (can read differently per tenant, e.g. "Senior Agronomist" at one company, "Consulting Agronomist" at another), lat/lng (an officer may cover a different service area per tenant relationship), availability, tenant-controlled `isVerified` badge, rating/reviewsCount (**per-tenant, not shared** — a farmer's review reflects that officer's service *through that specific tenant*, not a global reputation score), `consentRecordedAt`, `isActive` |

**3.6.2 Adding an Officer**
Tenant staff search for an existing `Officer` by name/phone (to avoid creating a duplicate identity if the person is already listed by another tenant) or create a new one if none matches. Either way, the action that actually happens from the tenant's perspective is creating an `OfficerTenantListing` scoped to their own `tenantId` — the underlying `Officer` identity is shared read-only reference data, never editable by one tenant's staff on another tenant's behalf. Consent (`consentRecordedAt`) is captured per listing, since a real officer must separately agree to be listed by each company that adds them.

**Duplicate-identity collision handling.** The search is fuzzy (name/phone match), not a hard uniqueness constraint, so an accidental duplicate `Officer` identity is possible if staff create-new instead of finding an existing match. `platform_staff` can merge two `Officer` identities from `/super-admin/tenants` support tooling (re-points every `OfficerTenantListing` FK from the duplicate to the canonical `Officer` row, then removes the duplicate) — a manual, staff-mediated resolution rather than an automated fuzzy-merge, since falsely merging two different real people would be a worse outcome than leaving a duplicate temporarily unresolved.

**3.6.2a Officer Identity Correction (MVP Workaround)**
Since `Officer` identity fields are shared, read-only reference data with no self-service officer login at MVP (see the Post-MVP note in [3.6.5](#365-deactivating-a-listing)), a correction to a shared field (e.g. an outdated phone number) has no direct tenant-side edit path by design. Any tenant staff member can flag a field via `Officer.correctionRequestedAt` ([0.6](#06-core-data-model)), which routes to a `platform_staff` review queue (alongside content moderation, [2.6.2](#262-content-moderation)) — `platform_staff` verifies and applies the correction directly, since they're the only role permitted to edit the shared `Officer` table. This is a deliberate MVP workaround, not a permanent design — the Post-MVP self-service officer login below removes the need for it.

**3.6.3 Officer List & Profile (dashboard view)**
Same field set as [0.6](#06-core-data-model)'s `OfficerTenantListing`, displayed joined with the read-only `Officer` identity fields. Contact fields (`phone`, `whatsapp`) are delivered on the public storefront profile via a **masked/click-to-reveal pattern** rather than shipped in the initial page payload — closes a bulk-scraping exposure gap, see [4.6](#46-nearby-help--agents).

**3.6.4 Verification Workflow**
New `OfficerTenantListing` rows default to `isVerified = false`; tenant staff manually verify before the badge appears publicly on that tenant's storefront. This badge is independent per tenant — an officer verified by Tenant A is not automatically verified on Tenant B's listing, since each tenant is vouching for that person's service through their own relationship, not endorsing a platform-wide claim. **Un-verify** is a distinct, available action (reverting `isVerified` to `false` without deactivating the listing entirely) — for when a tenant has cause to distrust a previously-verified officer but doesn't want to remove them from the directory outright; distinct from the heavier `isActive = false` action in 3.6.5.

**3.6.5 Deactivating a Listing**
A tenant can set `isActive = false` on its own `OfficerTenantListing` at any time (the officer stops working with that company) without affecting the shared `Officer` identity or any other tenant's listing of the same person.

> **Post-MVP:** a self-service field-officer login/dashboard (letting the officer themselves manage their own `Officer` identity fields directly, removing the need for the 3.6.2a workaround, and see/respond to all their tenant listings from one place) is a natural extension of this shared-identity model but explicitly out of scope for the first build — see [Appendix](#7-appendix).

### 3.7 Case Studies Management

**3.7.1 Case Study Editor**

| Field | Notes |
|---|---|
| problem, solution, result | Narrative text blocks. |
| yieldIncrease | Headline stat, e.g. "+34%". Tenants are contractually required (via ToS) to retain substantiation records for any efficacy claim made here, since this is displayed next to a direct purchase link — an unsubstantiated efficacy claim is a false-advertising exposure in most jurisdictions. |
| crop, location, duration | — |
| beforeImage, afterImage | Cloudinary, feeds the before/after slider on the public page. |
| productId | FK to that tenant's own Product — "Product Used" link. **If the linked Product is later archived** ([3.3.1](#331-product-list)), the case study page shows the "Product Used" info (name, image — using the same `OrderItem`-style read-only snapshot pattern) without a live "Buy Now" link, rather than a broken/dangling CTA — closing a gap where an archived product's continued reference from live public content was unaddressed. |
| tags[] | Used for public filtering. |
| farmer.name, farmer.avatar | Testimonial attribution. |
| timeline[] | Ordered list of `{day, title, description}` — recovery timeline builder. |
| successRate | 0–100, drives the confidence meter on the detail page. |
| isPublished | Boolean, default `false` — **draft vs. published state**, closing a gap where no visibility toggle existed for Case Studies despite every other CMS-like module (`isActive` for Products, `isVisible` for SectionContent) having one. A case study is only visible on the public storefront once explicitly published. |

The public case-study page carries a standing disclaimer ("individual results may vary; not independently verified by AgroSphere") — see [4.5](#45-case-studies). **Delete/archive**: a published case study can be unpublished (`isPublished = false`, reversible) or hard-deleted (irreversible, only available for never-published drafts) — closing a gap where no CRUD verb beyond "Editor" was stated for this module.

**3.7.2 Timeline Builder**
Repeatable field group UI (add/remove/reorder day entries), capped at **60 entries** (a concrete bound, since "day" entries realistically track a single growing-season recovery arc and an unbounded list was a real gap) — plain structured form, no rich-text/drag-and-drop, consistent with the CMS content-editing decision in [3.10](#310-storefront-cms--theme).

### 3.8 Dosage Calculator Configuration

Moves the currently hardcoded `data/calculator-data.ts` into tenant-editable config.

**3.8.1 Crop List**
CRUD `CropOption {id, name, icon}` and its `cropAdjustments` multiplier — **bounded to a `0.1`–`5.0` range** (a concrete validation bound; a zero or negative multiplier would be a nonsensical dosage calculation) (e.g. Rice ×1.2, Sugarcane ×1.5).

**3.8.2 Medicine / Product Dosage**
Per tenant-Product: `baseDose` (value + unit, e.g. "2.5 Liters"), description. Linked directly to that tenant's own Product catalog rather than a separate list, so dosage config and product catalog never drift apart. **Deletion sync, made explicit**: when a `Product` is archived ([3.3.1](#331-product-list)) or hard-deleted, its corresponding dosage-config row is archived/deleted in the same transaction — this is the actual mechanic that makes the "never drift apart" claim true, stated here rather than left as an assertion with no specified enforcement. This is also the reference data the chatbot's safety-anomaly check ([2.6.2](#262-content-moderation)) compares AI-generated dosage advice against.

**No orphaned dosage gap on new products.** The onboarding checklist ([3.2](#32-onboarding--setup-checklist)) does not include a dosage-config step, so a new product can go live without dosage data configured — the Precision Dose Calculator ([4.4](#44-precision-dose-calculator)) handles this gracefully by simply excluding un-configured products from its medicine-selection list (rather than showing a broken/zero-value calculation), and the product list ([3.3.1](#331-product-list)) surfaces a "dosage not configured" indicator as a nudge, not a hard block on publishing the product.

**3.8.3 Severity Multipliers**
Exactly **three fixed levels (Low/Moderate/Severe), not tenant-extensible** — a deliberate constraint stated explicitly here rather than left ambiguous: "editable per tenant" means only the multiplier *values* are editable, not the number or names of levels. Multiplier values editable per tenant (defaults: ×1.0 / ×1.5 / ×2.0, matching current logic), same `0.1`–`5.0` bound as [3.8.1](#381-crop-list).

Formula (unchanged from current implementation):
```
requiredQuantity = baseDose × areaInAcres × cropMultiplier × severityMultiplier
```

### 3.9 Customer Management

**3.9.0 Customer List**

| Field (displayed) | Notes |
|---|---|
| name, email | From the customer's `User` row. |
| joinDate | `User.createdAt` for this tenant's account. |
| orderCount | Read-only, computed — lifetime order count on this tenant's storefront. |
| totalSpend | Read-only, computed — lifetime sum of `Order.total` for `payment_confirmed` or later statuses (excludes `cancelled`/`payment_failed` orders, so a customer who abandoned checkout repeatedly doesn't inflate this figure). |
| lastOrderDate | Read-only, computed. |
| isBlocked | See [3.9.0c](#390c-block--suspend-a-customer). |

Searchable/filterable by name/email, order-count tier (0 / 1-4 / 5+), total-spend tier, join date range — matching the same rigor already given to Products and Orders, closing a gap where this module was the only major dashboard list with no search/filter treatment at all.

**UI states**: **empty state** (a brand-new tenant with zero customers) shows a note pointing at the storefront's live URL rather than a bare empty table, since the natural next action is "share your storefront link," not an in-dashboard action.

**3.9.0a Customer Detail**
`/dashboard/customers/[id]` — full order history, and (Business plan) chat/diagnosis history for that customer, drilled into from the list. Closes a gap where only the list view was specified with no detail route.

**3.9.0b Customer Export**
CSV export of the customer list, same mechanism as [3.14.1](#3141-bulk-product-import--export)/[3.14.2](#3142-order-export) — closing a gap where Products and Orders both got export capability but Customers did not, despite CRM/email-marketing use cases being exactly the kind of "boring but essential" feature this module's own sibling ([3.14](#314-bulk-operations--commerce-utilities)) was built to cover.

**3.9.0c Block / Suspend a Customer**
`tenant_owner`/`tenant_admin` can block a customer account from further purchases on their storefront (`isBlocked` boolean on the customer relationship — tenant-scoped, not a platform-wide ban) — closing a real gap where the review-fraud and rating-velocity anomaly detection in [3.3.3a](#333a-review-integrity) had no corresponding enforcement action available against the flagged customer. A blocked customer can still view their existing order history in `/profile` but cannot check out on that tenant's storefront; this does not affect their account on any other tenant's storefront, consistent with the tenant-scoped identity model.

**3.9.1 Farmer-Facing Support Channel**
A tenant support email/contact method is captured here and surfaced on the storefront (footer and order-confirmation emails), giving farmers a clear channel for order/product complaints that is explicitly the tenant's responsibility, not the platform's ([2.6.1](#261-support-tickets)). A full in-dashboard messaging tool remains a fast-follow, but this minimal channel is MVP-required since its absence was a genuine support gap, not just a nice-to-have.

### 3.10 Storefront CMS & Theme

> **Every new tenant is seeded from the current AgroSphere design** — colors, fonts, and section copy — so a freshly onboarded company's storefront looks identical to today's live site until the tenant edits something, and every section heading/label/copy block discussed elsewhere in this document (Hero, WhyChoose, Testimonials, ChatFAQ, footer, etc) is seeded from that same current design, not left blank or placeholder. Seed content is versioned per [2.5.3](#253-default-content-seeds). This default-theme requirement is why [3.10.6](#3106-pre-migration-codebase-cleanup) below is a hard prerequisite, not optional cleanup — the current codebase cannot literally serve as a seed source in its present state.

**3.10.1 Brand / Theme Tokens**

Default seed values (from the current `styleGuideline.md`):

| Token | Hex |
|---|---|
| Primary — Deep Green | `#1B5E20` |
| Secondary — Fresh Leaf | `#4CAF50` |
| Accent — Golden Wheat | `#C9A227` |

Editable per tenant: primaryColor, secondaryColor, accentColor, fontFamily, logo upload, favicon upload. Applied at runtime as CSS custom properties on the tenant's root layout, served from the cached theme lookup described in [5.10](#510-caching-strategy). **Color input validation**: each color field requires a valid hex code (rejected otherwise, not silently accepted as an invalid CSS value) and the editor surfaces a **contrast-ratio warning** (not a hard block) when a chosen `primaryColor`/`accentColor` would fail WCAG AA contrast against white/black text — a soft guardrail rather than no validation at all.

**3.10.2 Page & Section Content Editor**
For every storefront page (Home, Products, Case Studies, Nearby Help, Field Mapping, Precision Dose, Cart, Profile), a plain structured form per section: Headline, Subheadline, Body Text, Image — matching the exact sections already coded (Hero, Categories, WhyChoose, CropSolutions, Testimonials, ChatFAQ, Newsletter, Contact, etc), with a locale selector per [0.8](#08-localization--currency). No rich-text editor, no drag-and-drop — fields map 1:1 onto existing component props. **The set of sections per page is fixed** (matches the coded components), not tenant-extensible — a tenant cannot add a new custom section; this is a deliberate constraint of the "structured forms over a page builder" decision ([7.1](#71-explicitly-out-of-scope-mvp)), stated explicitly here rather than left ambiguous next to `SectionContent.order`'s existence. Reordering *within* the fixed section set for a page **is** a real capability, surfaced as drag-to-reorder in the section list (using `SectionContent.order`, [0.6](#06-core-data-model)) — the field existed in the schema before this fix but had no corresponding UI capability stated; that gap is closed here.

**3.10.2a Preview & Version History**
Previously absent entirely — a real gap for storefront-facing content customers see immediately. Now:
- **Preview before publish**: an edit to `SectionContent` saves as a new row with `publishedAt = null` (a draft revision, linked via `revisionOf` to the prior published version, [0.6](#06-core-data-model)) rather than overwriting the live row directly. A "Preview" action renders the storefront page using the draft revision, visible only to authenticated dashboard staff (via a preview-mode cookie/token), before the tenant clicks "Publish" to set `publishedAt = now()` and make it live — closing a gap where a typo or bad color choice previously went live to farmers instantly with no review step.
- **Version history & undo**: every prior published revision remains queryable via its `revisionOf` chain — a tenant can view past versions of any section and **revert** (creating a new draft copying an old revision's content, then publishing it) rather than needing to manually re-enter old values from memory. This mirrors the versioning rigor already given to platform-level seed content ([2.5.3](#253-default-content-seeds)), now extended to a tenant's own day-to-day edits, which previously had none.

**3.10.3 Page Visibility Toggles**
Enable/disable **optional** pages per tenant (e.g. a tenant may not want Field Mapping live) — explicitly, the set of toggle-eligible pages is Field Mapping, Nearby Help, Precision Dose, and Case Studies; core commerce pages (`/products`, `/cart`, `/checkout`, `/profile`) are **structurally mandatory and not toggle-eligible**, stated explicitly here rather than left for the reader to infer from "optional pages." Disabled pages 404 on the storefront and disappear from navigation. **Graceful degradation for existing references**: a farmer with a bookmarked link, an in-progress action, or a saved wishlist item referencing content on a since-disabled page sees the same tenant-aware 404 as any other visitor (consistent with [5.1.1](#511-tenant-resolution-runs-first-on-every-request)'s unknown-route handling) rather than a broken/blank page — no special-cased recovery flow, since a tenant disabling a page is treated as a deliberate content decision the same way archiving a product is.

**3.10.4 SEO / Metadata**
Per-page `metaTitle` (60-character guidance limit), `metaDescription` (160-character guidance limit — standard SEO best-practice lengths, given as concrete values rather than left unquantified), `ogImage` — feeds Next.js `generateMetadata()` per route, tenant-scoped.

**3.10.5 URL / Route Slugs — Fast-Follow**
Not in MVP. Post-MVP: tenants rename core route slugs (e.g. `/products` → `/shop`). Full mechanics in [5.1.8](#518-fast-follow-renameable-route-slugs).

**3.10.6 Pre-Migration Codebase Cleanup**

> Added after auditing the current single-tenant codebase against the default-theme requirement above. The current code cannot literally serve as the seed source for [3.10.1](#3101-brand--theme-tokens)/[3.10.2](#3102-page--section-content-editor) as-is — two specific issues must be fixed **during implementation, before** the CMS/theming module is built, not discovered after:

- **Brand name inconsistency.** The current codebase is not cleanly "AgroSphere" throughout — `components/layout/Footer.tsx` currently renders the logo/wordmark as "AgriVision" while the copyright line three lines below reads "© AgroSphere," a leftover from an earlier product rename that was never fully cleaned up. Every literal brand-name string across the codebase (~15 components currently hardcode "AgroSphere" as literal text, per a full-codebase audit) must be resolved to one consistent name before it becomes the seeded default `SectionContent`/copy for every new tenant — seeding a contradiction is worse than seeding nothing.
- **Color system is not centralized.** `styleGuideline.md` documents the brand palette (`#1B5E20`, `#4CAF50`, `#C9A227`), but these hex values currently exist only as scattered Tailwind arbitrary values (`bg-[#4CAF50]`, `text-[#4CAF50]`, etc.) inlined across 10+ component files — including at least one untracked, undocumented shade (`#113B13`) found only in the footer — rather than as centralized CSS custom properties/theme tokens in `app/globals.css`. Per-tenant theming ([3.10.1](#3101-brand--theme-tokens)) requires these to be consolidated into a single `@theme` token set (`--color-primary`, `--color-secondary`, `--color-accent`, etc.) that every component reads from, **before** the tenant-override mechanism can work — otherwise "changing a tenant's theme color" would require a find-and-replace across dozens of files instead of updating one set of CSS variables. This is real refactor work, not a config change, and is sequenced as a required step in the Company Dashboard build, not deferred.
- **Chatbot system prompt is a hardcoded string, not data.** `app/api/chat/route.ts` currently bakes `"You are AgroSphere AI..."` directly into the literal prompt string sent to OpenAI (already marked as temporary in the file's own comments). This must become a template pulling from `Tenant`/system-prompt configuration ([3.11.5](#3115-system-prompt--branding)) rather than a hardcoded default — the current string becomes the seeded default value, not the permanent implementation.

### 3.11 AI & RAG Knowledge Base

**3.11.1 Document Upload**
Tenant staff upload PDFs/docs (product spec sheets, usage guides, company policies) via `/dashboard/ai/documents`. **Storage quota is checked before the upload is accepted** (against `Tenant.storageUsedBytes` and the plan's cap — see [5.4.1](#541-storage-quota-enforcement)), not after. File stored via Cloudinary with **signed/authenticated delivery** (not a public URL — these documents may contain sensitive company policy content, see [5.4](#54-file-storage--cloudinary)), `TenantDocument.status = processing`, triggers an Inngest background job.

**Replacing an already-`ready` document.** Uploading a corrected version of an existing document (e.g. an updated spec sheet) is a **delete-then-reupload** action, not an in-place update — the old document's chunks are removed from retrieval immediately on delete ([3.11.3](#3113-document-list--status)), and the new upload goes through the full pipeline (including moderation review if applicable) before its chunks become retrievable. This creates a brief retrieval gap for that document's content, stated here explicitly as an accepted tradeoff (in-place replacement would need a more complex atomic-swap mechanism not justified at MVP scale) rather than an unstated side effect.

**3.11.2 Embedding Pipeline (background)**

```
Upload → Extract text (batched by page-range) → Chunk (~500–1000 tok, overlap, batched)
  → Embed (OpenAI, batched) → Store in pgvector (raw SQL) → moderation scan → status = ready | pending_review
```

Runs as a multi-step Inngest function, deliberately broken into small batched steps (not four monolithic stages) so a single large PDF cannot exceed any one step's own duration budget. Failure sets `status = failed` with a retry action in the dashboard. The moderation scan is the pre-publish safety check described in [2.6.2](#262-content-moderation).

**Idempotent resume, not reprocess-from-scratch.** Each batched step is implemented as its own Inngest `step.run`, relying on Inngest's built-in step-level memoization: if the function retries after a partial failure (e.g. chunk-embedding batch 51 of 80 fails), already-completed steps (batches 1-50) return their cached result instead of re-executing — the pipeline resumes from the failed step, it does not restart from the top. This is stated explicitly because the alternative (a naive retry re-running the whole function) would silently re-bill OpenAI for chunks already embedded on every transient failure, which is exactly the kind of repeated-reprocessing cost bug the AI cost-anomaly alerting in [5.11.2](#5112-ai-cost-anomaly-alerting) exists to catch — better to prevent it at the pipeline level than rely on catching it after the fact.

**3.11.3 Document List & Status**
Table: file name, upload date, status (including `pending_review`/`flagged`), chunk count, delete action (cascades to `DocumentChunk` rows, removing that content from future retrieval immediately).

**3.11.4 Chat Log Viewer**
Read-only view of customer conversations with the RAG chatbot — visibility into what the AI is telling customers, which source documents it cited, and where it had no grounded answer (flag for content gaps). Also surfaces the real-time anomaly flags described in [2.6.2](#262-content-moderation).

**3.11.5 System Prompt / Branding**
Tenant-editable chat persona: assistant name, tone, company-specific system prompt prefix — layered on top of the base AgroSphere system prompt, which itself always includes the mandatory disclaimer language from [5.14.2](#5142-ai-advice-disclaimer--consent-policy) — tenants can extend the persona but cannot remove the disclaimer. **The prompt prefix is capped at 2,000 characters** and passes through the same automated safety classifier used for document moderation ([2.6.2](#262-content-moderation)) before it can be saved — closing a gap where an unbounded, unscanned tenant-authored prompt was itself a prompt-injection and token-cost-inflation vector that documents were protected against but this field was not.

**3.11.6 Chatbot Live Toggle**
A single on/off switch on `/dashboard/ai/settings` (Business plan only) — `Tenant.chatbotEnabled: boolean`, default `false` until the tenant explicitly turns it on. When off, the storefront chat widget is not rendered at all (not just disabled) and `/chatbot` redirects to `/`. Lets a tenant pause the chatbot on their live storefront — e.g. while re-uploading documents, or before they're ready to go live with it — without losing configuration, uploaded documents, or chat history. Distinct from plan-based gating (1.3.1a): a Business-tier tenant can still be plan-eligible but toggled off; a Startup/Standard tenant cannot toggle it on regardless, since the module itself is hidden behind the locked preview state (1.3.1b).

### 3.12 Image Diagnosis Settings

**3.12.1 Diagnosis Log**
Every customer image-diagnosis request, with the Kindwise result, confidence score, matched products, and outcome (did it lead to an order) — sales-signal visibility per tenant, and retained explicitly as the evidentiary record for any future dispute over AI-driven advice, per [5.14.2](#5142-ai-advice-disclaimer--consent-policy). **Searchable/filterable** by disease type, date range, confidence level, and outcome (led-to-order vs. not) — closing a gap where this was the only AI-facing log with no stated filter capability, unlike [3.11.4](#3114-chat-log-viewer).

**3.12.2 Disease → Product Mapping Rules**
A **rule table**, not a single dropdown: one row per `(Kindwise disease category, tenant role tag)` pair, each independently overridable — e.g. a tenant can map "fungal_rust" to their `fungal`-tagged products by default, or override it to point at a specific product/category if their catalog's role-tag vocabulary doesn't cleanly match (since [3.3.2](#332-create--edit-product)'s role-tag vocabulary is "suggested... not enforced," this rule table is explicitly the tenant's tool for reconciling a messy/inconsistent tag set against Kindwise's fixed categories, rather than assuming a clean 1:1 match). Default mapping is automatic based on Kindwise's returned category; tenant overrides take precedence. Recommendations below the platform-wide confidence floor ([5.14.2](#5142-ai-advice-disclaimer--consent-policy)) never surface a product mapping regardless of tenant override — the floor is a hard platform rule, not tenant-configurable.

### 3.13 Tenant Dashboard (Home)

Landing view after login: revenue this month, pending orders count, low-stock products, recent diagnosis requests, dispute/chargeback alerts, setup checklist (if incomplete), **AI usage against plan cap (Business plan only — silently omitted from the widget set for Startup/Standard tenants, for whom this metric doesn't apply, rather than shown empty or erroring)**. `/dashboard` itself remains accessible to all staff roles at every plan tier ([3.15](#315-company-dashboard-route-map)) — only this one widget within it is plan-conditional, stated explicitly here since every other gated route in this document carries an inline plan annotation and this one previously didn't.

**3.13.1 Advanced Analytics** *(Business plan)*
Beyond the basic revenue/order metrics available at every tier ([3.5.3](#353-finance--revenue)), Business-tier tenants get: customer cohort/retention view, customer lifetime value (CLV) estimate per customer, product-performance trend (which categories are growing/declining over time), and a **diagnosis-to-purchase conversion funnel** — what fraction of image-diagnosis requests led to a product recommendation, an add-to-cart, and a completed order. This last report is cheap to build since `DiagnosisRequest.recommendedProductIds` and the resulting `Order` are already linked in the data model ([0.6](#06-core-data-model)); it is a reporting view on existing data, not a new tracking system.

### 3.14 Bulk Operations & Commerce Utilities

> Added after a pricing/feature-completeness audit against Shopify, BigCommerce, and agri-commerce category leaders. These are industry-standard "boring but essential" features that were absent from the original design; several are cheap to build (the underlying data already exists) and their absence would have created real onboarding friction (a distributor will not hand-enter 200 SKUs) or basic compliance friction (Stripe Tax is wired in at checkout but there was no invoice a tenant or farmer could actually download).

**3.14.1 Bulk Product Import / Export** *(every plan)*
CSV upload for product creation/update — name, price, category, stock, SKU, role tag, regulatory class fields (mapped to the same validation rules as the single-product form in [3.3.2](#332-create--edit-product)).

**Image handling — previously a confirmed contradiction, now resolved.** [3.3.2](#332-create--edit-product) requires a minimum of one image per product; the original CSV column list had no image field at all, meaning a bulk-imported product would silently violate that rule or need 200 manual follow-up edits, defeating the feature's purpose. Fixed: the CSV format includes an `imageUrls` column accepting **one or more publicly-fetchable image URLs, pipe-separated** (`url1|url2|url3`) — the import job fetches each URL and re-uploads it to Cloudinary server-side during processing (not requiring the tenant to pre-upload to Cloudinary themselves). A row with zero valid image URLs fails the same validation gate as a single-product create with no image, consistent with — not exempt from — [3.3.2](#332-create--edit-product)'s rule.

**`approvedLabelUrl` handling.** Same pattern extended: a `labelDocumentUrl` column (a publicly-fetchable URL to the label PDF) is fetched and re-uploaded with signed Cloudinary delivery during import — required for any row with `regulatoryClass = restricted_use`, same fail-the-row behavior as a missing image. This closes the second half of the same gap: without this column, **any restricted-use product was effectively unimportable via CSV**, undermining the bulk-import feature for exactly the regulated-product tenants (pesticide companies) this platform serves.

**Partial-success import UX.** **Partial import, with a downloadable results report** — the design choice explicitly made here (matching Shopify's pattern over an all-or-nothing ERP-style batch): valid rows commit immediately; invalid rows are skipped and do not block the rest of the batch. On completion, the tenant sees a results summary ("187 imported, 13 failed") and can download a rejected-rows CSV annotated with the specific validation failure per row (missing image, invalid SKU duplicate, restricted-use without a label, etc.) — closing a gap where neither the commit strategy nor any results/error reporting was specified at all, despite this being the single most failure-prone flow in the module by its own stated motivation (any real 200-SKU import will hit row-level errors in practice).

CSV export of the current catalog (including image/label URLs) for backup/editing offline. This directly addresses onboarding speed — a pesticide distributor with an existing catalog should not have to re-key it product-by-product.

**3.14.2 Order Export** *(every plan)*
CSV export of order history, filtered by the same criteria as the order list ([3.5.2](#352-order-list--detail)). **Field list**: order ID, date, customer name/email, line items (product name, quantity, price), subtotal, tax, total, status, shipping address — matching the level of field-list specificity already given to the Product CSV in [3.14.1](#3141-bulk-product-import--export), for tenants who reconcile orders in their own accounting tools.

**3.14.3 Invoice & Tax Document Generation** *(every plan)*
A downloadable PDF invoice per order, including the Stripe Tax breakdown ([5.2.5](#525-tax-calculation--remittance)), available to both the tenant (dashboard) and the customer (`/profile` order history, [4.10](#410-profile--order-history)). This is treated as a baseline expectation, not a premium feature — withholding it creates real compliance friction for tenants in markets where a GST/VAT-compliant invoice is close to a legal expectation for B2B agri buyers, not a nice-to-have. **Regeneration on correction**: beyond the already-specified refund case ([6.11](#611-refund-initiation) step 5), a staff-made shipping-address correction or order-status correction after the original invoice was generated also triggers PDF regeneration, so the downloadable document always reflects the order's current, corrected state rather than a stale snapshot.

**3.14.4 Low-Stock Alerts** *(every plan)*
The dashboard home ([3.13](#313-tenant-dashboard-home)) already computes and displays low-stock products; this adds an actual notification (dashboard banner + optional email digest via Resend) when a product crosses its configured stock threshold, rather than requiring the tenant to notice it on the home screen. Near-zero additional cost since the underlying detection already exists.

**3.14.5 Wishlist / Saved Items** *(every plan, storefront)*
Customer-facing save-for-later on the product catalog ([4.3.1](#431-catalog)), persisted per customer account.

**3.14.6 Bulk Reorder** *(every plan, storefront)*
"Reorder" action on a past order in `/profile` order history, pre-filling the cart with the same line items and quantities. This matches actual farmer purchasing behavior better than most generic e-commerce features on this list — agri-input buying is heavily seasonal-repeat (the same fungicide, the same fertilizer, restocked each season), so this is prioritized at the entry tier rather than treated as a growth feature.

**3.14.7 Abandoned Cart Recovery** *(Standard+)*
A scheduled Inngest job identifies carts with items added but no completed checkout within a configurable window, and sends a reminder email via Resend. Standard-tier feature since it's a growth/marketing lever, matching how BigCommerce gates the equivalent feature at its mid tier rather than entry.

**3.14.8 Back-in-Stock Notifications** *(Standard+)*
A customer can opt in on an out-of-stock product page to be emailed when stock is replenished — a stock-watch table plus a trigger on the existing stock-update path in [3.3.2](#332-create--edit-product).

**3.14.9 Product Bundles / Kits** *(Standard+)*
Tenants can group multiple products into a bundle with its own price (e.g. a "Rice Protection Pack" combining a herbicide, fungicide, and fertilizer) — a natural extension of the existing cart smart-tagging concept ([4.3.3](#433-cart--protection-plan)). `Bundle` (see [0.6](#06-core-data-model) for the canonical field list) references multiple `Product` rows with quantities and a bundle-level price/discount.

**Bundle stock-decrement.** A bundle purchase decrements stock on **every constituent Product**, using the same atomic, `stockVersion`-guarded mechanism as a standalone product purchase ([3.3.1a](#331a-stock-decrement--concurrency-control)) — applied to all constituent products within a single database transaction, so a bundle purchase either fully succeeds (all constituents decremented) or fully fails, never a partial decrement across some constituents. **Partial availability within a bundle** (one constituent out of stock, others available) blocks the bundle purchase entirely at checkout — the bundle is shown as unavailable/out-of-stock on the storefront the moment any constituent's stock reaches zero, rather than allowing a purchase that can only be partially fulfilled, consistent with [3.5.1c](#351c-partial-shipment--explicitly-out-of-scope-at-mvp)'s no-partial-fulfillment decision.

**3.14.10 Group / Volume Pricing** *(Standard+)*
Tiered price breaks on a per-product basis (e.g. 1–9 units at list price, 10–49 at a 5% break, 50+ at a 10% break), and a lightweight "group order" cart flow for farmer cooperatives buying collectively — a recognized pattern in the target market where agri-input purchasing frequently happens through collectives rather than individual farmers. `Product` gains an optional `priceBreaks[]` field (`{minQty, price}`); checkout applies the matching break automatically based on cart quantity.

**3.14.11 Tenant-Visible Staff Audit Log** *(Standard+)*
The platform already maintains a general-purpose `AuditLog` ([0.6](#06-core-data-model)), but it was previously visible only to platform staff at `/super-admin/audit`. This exposes a **tenant-scoped, read-only, filtered view** of that same table (`WHERE tenantId = current`) at `/dashboard/audit` — who changed a price, who issued a refund, who deleted a product, filterable by staff member and date. This is mostly a new read view over existing data and access control, not new data modeling, since the writes already happen throughout the dashboard's sensitive actions.

### 3.15 Company Dashboard Route Map

| Route | Access | Module |
|---|---|---|
| `/dashboard/login` | Public (tenant-scoped) | 3.1 |
| `/dashboard/setup` | tenant_owner, tenant_admin | 3.2 |
| `/dashboard` | All staff roles | 3.13 |
| `/dashboard/account` | All staff roles (self-service only) | 3.1.3a |
| `/dashboard/staff` | tenant_owner, tenant_admin | 3.1 |
| `/dashboard/staff/invite` | tenant_owner, tenant_admin | 3.1.2 |
| `/dashboard/staff/[id]` | tenant_owner, tenant_admin | 3.1.4 |
| `/dashboard/products` | owner, admin, product_manager | 3.3 |
| `/dashboard/products/new` · `/[id]/edit` | owner, admin, product_manager | 3.3.2 |
| `/dashboard/categories` | owner, admin, product_manager | 3.4 |
| `/dashboard/orders` | owner, admin, order_manager | 3.5 |
| `/dashboard/orders/new` | owner, admin, order_manager, product_manager | 3.5.1d |
| `/dashboard/orders/[id]` | owner, admin, order_manager | 3.5.2 |
| `/dashboard/finance` | owner, admin, finance_manager *(basic view: all plans; refunds/disputes: Standard+)* | 3.5.3 |
| `/dashboard/discounts` | owner, admin, order_manager *(Standard+ plan)* | 3.5.4 |
| `/dashboard/agents` | owner, admin *(Standard+ plan; locked preview below it)* | 3.6 |
| `/dashboard/agents/new` · `/[id]/edit` | owner, admin *(Standard+ plan)* | 3.6 |
| `/dashboard/case-studies` | owner, admin, content_manager | 3.7 |
| `/dashboard/calculator-config` | owner, admin, product_manager | 3.8 |
| `/dashboard/customers` | owner, admin | 3.9 |
| `/dashboard/customers/[id]` | owner, admin | 3.9.0a |
| `/dashboard/customers/export` | owner, admin | 3.9.0b |
| `/dashboard/reviews` | owner, admin, product_manager | 3.3.3 |
| `/dashboard/support` | All staff roles (submit); owner, admin (full thread) | 3.9.1, 2.6.1 |
| `/dashboard/theme` | owner, admin, content_manager | 3.10.1 |
| `/dashboard/pages` | owner, admin, content_manager | 3.10.2–3.10.4 |
| `/dashboard/ai/documents` | owner, admin *(Business plan)* | 3.11.1–3.11.3 |
| `/dashboard/ai/chat-logs` | owner, admin *(Business plan)* | 3.11.4 |
| `/dashboard/ai/settings` | tenant_owner, tenant_admin *(Business plan)* | 3.11.5, 3.11.6 |
| `/dashboard/ai/diagnosis-log` | owner, admin *(Business plan)* | 3.12 |
| `/dashboard/analytics` | owner, admin *(Business plan)* | 3.13.1 |
| `/dashboard/products/import` | owner, admin, product_manager | 3.14.1 |
| `/dashboard/orders/export` | owner, admin, order_manager | 3.14.2 |
| `/dashboard/bundles` | owner, admin, product_manager *(Standard+ plan)* | 3.14.9 |
| `/dashboard/products/[id]/edit` (pricing tab) | owner, admin, product_manager *(Standard+ plan)* | 3.14.10 — group/volume pricing lives inside the product edit form, not a standalone page, stated explicitly here rather than left as a silent omission |
| `/dashboard/audit` | tenant_owner, tenant_admin *(Standard+ plan)* | 3.14.11 |
| `/dashboard/billing` | tenant_owner only | Stripe Connect status, platform plan, upgrade/downgrade — always reachable even when suspended |

---

## 4. User-Side Storefront

**System:** Customer-facing · `{tenant}.agrosphere.com`

The existing public site, now rendered per-tenant with CMS-driven content and real backend persistence in place of static mock data. Page structure and components are unchanged from the current build; every module below maps to an existing route already implemented in the codebase.

### 4.1 Authentication

NextAuth credentials + database sessions, replacing the current cookie/JWT calls to the deleted NestJS backend (`NEXT_PUBLIC_BASE_BACKEND_URL` references in `AuthContext.tsx`, `login/page.tsx`, `signup/page.tsx` are removed and rewired to NextAuth). Customer accounts are tenant-scoped: a farmer's login on one tenant's subdomain does not carry over to another tenant's subdomain — enforced structurally by the `(email, tenantId)` uniqueness scope and host-only session cookies, see [0.6](#06-core-data-model) and [5.1.4](#514-cookie--session-scoping-policy).

| Route | Method |
|---|---|
| `/login` | POST → NextAuth signIn, scoped to the resolved tenant's user pool |
| `/signup` | POST → create customer User, tenantId from current subdomain |

**Cart merge on login.** A guest's pre-login cart (client-side/anonymous-session-keyed) is merged into the now-authenticated customer's persisted cart immediately on successful login or signup, before any post-login redirect completes — a guest who adds items, proceeds to checkout, and is redirected to log in does not lose their cart contents.

**Email verification.** `User.emailVerified` ([0.6](#06-core-data-model)) is a real, enforced gate, not a dormant schema field. On signup, a signed-token verification email is sent via Resend (same token pattern as [5.1.9](#519-password-reset-flow) — single-use, expiring). Checkout is **not hard-blocked** on verification (matching how most B2C storefronts avoid adding friction to a first purchase), but an unverified account shows a persistent, dismissible banner ("Verify your email to receive order updates and enable password recovery") and a resend option — since order-confirmation emails, invoice PDFs ([3.14.3](#3143-invoice--tax-document-generation)), and password reset ([5.1.9](#519-password-reset-flow)) are all otherwise unreachable for a typo'd or fake address. The same verification requirement applies to [4.10.1](#4101-email-change)'s email-change flow before the new address takes effect.

### 4.2 Home

Hero, Categories, Products, WhyChoose (ScrollStack), CropSolutions, Testimonials, ChatFAQ, Newsletter, Contact — every section's text/image now sourced from that tenant's `SectionContent` rows (cached per [5.10](#510-caching-strategy)) instead of hardcoded JSX.

| Route |
|---|
| `/` |

### 4.3 Products & Cart

**4.3.1 Catalog**
Search, category filter chips, pagination (8/page), add-to-cart, **wishlist/save-for-later** ([3.14.5](#3145-wishlist--saved-items)) — now querying that tenant's live `Product` table instead of `data/products.ts`. Bundles ([3.14.9](#3149-product-bundles--kits)) appear alongside individual products where a tenant has configured them, and group/volume pricing ([3.14.10](#31410-group--volume-pricing)) is reflected in the displayed price once cart quantity crosses a configured break.

**4.3.2 Product Detail**
Server-rendered detail page, related products (same category, that tenant only, fetched via a single join query, not a per-item loop). For `restricted_use` products, the approved label document is linked verbatim alongside the marketing description. Out-of-stock products offer a **back-in-stock notification** opt-in ([3.14.8](#3148-back-in-stock-notifications)).

**4.3.3 Cart — "Protection Plan"**
Same smart-tagging logic (role/strength/coverage derived from category) as the current `CartContext`, now persisted server-side per customer instead of resetting on page load with demo seed data. Carts abandoned past a configured window trigger the recovery flow in [3.14.7](#3147-abandoned-cart-recovery) (Standard+ tenants).

**Stale cart items.** If a cart line item's underlying `Product` is archived ([3.3.1](#331-product-list)) or deactivated (`isActive = false`) between add-to-cart and the next cart view, it is **automatically removed from the cart with a visible notice** ("AgriShield Pro is no longer available and was removed from your cart") rather than silently persisting as a broken line item or blocking checkout with an opaque error — closing a gap where this interaction was entirely unaddressed. `OrderItem`'s name/price snapshot ([0.6](#06-core-data-model)) protects *completed* orders from this issue; the cart, being pre-purchase, has no such snapshot and needs this explicit removal behavior instead.

**4.3.4 Checkout**
New — did not exist before. Stripe Checkout session created against the *tenant's* Connect account, so payment lands directly with that company (see [5.2](#52-payments--stripe-connect-express)). Tax is calculated via Stripe Tax ([5.2.5](#525-tax-calculation--remittance)). If any cart line item is `requiresApplicatorCredential`, checkout requires an applicator license reference before payment can proceed. CSRF-protected per [5.1.10](#5110-csrf-policy) — since Stripe's redirect back to `/checkout/success` is a browser GET navigation, not a cross-origin POST, it does not trigger the Origin/Referer CSRF check at all, so no special-cased interaction with [5.1.4](#514-cookie--session-scoping-policy)'s `SameSite` carve-out is actually needed here; that carve-out exists for the (distinct) cookie-delivery concern, not for CSRF validation of the redirect itself, stated explicitly here to close a previously-unreconciled cross-reference.

**Stock unavailability at checkout time.** Re-validated server-side at Checkout Session creation, not assumed from the cart's last-known state: any line item whose current `stock` is insufficient for the requested quantity blocks checkout for **that item only** — the farmer sees a clear per-item message ("Only 3 left — update quantity to continue") and can adjust or remove that item to proceed with the rest of the cart, rather than the entire checkout failing opaquely or (worse) succeeding and silently overselling. This is the checkout-time surface of the stock-locking mechanism specified in [3.3.1a](#331a-stock-decrement--concurrency-control) — the actual atomic decrement happens at payment confirmation, but availability is checked again here as an earlier, farmer-facing UX gate. See [6.16](#616-checkout-time-stock-unavailability) for the full flow.

**Client-side idempotency.** The client generates a UUID per checkout attempt (persisted with the cart/session state until the attempt succeeds or is explicitly abandoned) and sends it as `Idempotency-Key` on the request that creates the Stripe Checkout Session, following Stripe's own documented idempotent-request pattern. This is distinct from — and layered underneath — the webhook-level deduplication in [5.2.4](#524-webhook-idempotency--deduplication), which only dedups *incoming Stripe events*, not the outbound session-creation call itself: without this key, a double-click on "Pay Now," or a client retry after a slow/dropped response but before the farmer sees a success state, can create two separate Checkout Sessions and, in the worst case, two separate charges — webhook dedup does nothing to prevent this, since Stripe would correctly treat both as legitimately distinct events.

| Route |
|---|
| `/products` |
| `/products/[id]` |
| `/cart` |
| `/checkout` |
| `/checkout/success` |

### 4.4 Precision Dose Calculator

Crop → Medicine/Product → Area (acres) → Severity → computed dose, sourced from that tenant's [3.8 calculator config](#38-dosage-calculator-configuration) rather than the hardcoded `data/calculator-data.ts`. Add-to-cart CTA on result.

| Route |
|---|
| `/precision-dose` |

### 4.5 Case Studies

Grid + filter by problem-tag, before/after slider hero. Detail page: timeline, confidence meter, linked product, similar cases (single join query, not per-item loop) — all from that tenant's own [Case Study](#37-case-studies-management) records, with the standing "individual results may vary" disclaimer noted in [3.7.1](#371-case-study-editor).

| Route |
|---|
| `/case-studies` |
| `/case-studies/[id]` |

### 4.6 Nearby Help / Agents

> **Standard+ plan feature** — locked/preview below Standard for a Startup-tier tenant's storefront, see [2.3.1b](#231b-lockedupgrade-preview-state). Stated inline here, not only in the cross-referenced gating section, so this module's own text is self-sufficient for a reader who lands on it directly.

Geolocation-gated Leaflet map of that tenant's field officers, Haversine distance/ETA, auto-select nearest available expert, bottom-sheet contact actions. The map query is `SELECT ... FROM OfficerTenantListing JOIN Officer WHERE tenantId = current AND isActive = true` (see [3.6.1](#361-officer-identity-vs-tenant-listing)) — even though the same `Officer` identity may be listed by several tenants, a farmer on `bayer.agrosphere.com` only ever sees Bayer's own listings, never another tenant's. Officer profile page shows that tenant's verification badge, specializations, that tenant's own rating (not a cross-tenant aggregate), "Connect Now" CTA. Phone/WhatsApp contact details render as **masked, click-to-reveal** elements rather than being embedded directly in the initial page payload — closing a bulk-scraping exposure gap for real people's personal contact information. Both this page and the underlying map data endpoint are rate-limited per [5.6](#56-rate-limiting--upstash-redis) to deter automated harvesting.

**Thin-density empty state.** A new or small tenant may have few or zero officer listings near a given farmer's location. Nearby Help **never falls back to showing another tenant's officers** — this is a deliberate consequence of the platform's isolated-storefront model ([0.4](#04-tenancy-model)), not an oversight. Instead, an empty map state shows a clear message ("No verified field officers near you yet") and, if the tenant's own support contact is configured ([3.9.1](#391-farmer-facing-support-channel)), offers that as a fallback contact path. This is called out explicitly in the tenant onboarding checklist ([3.2](#32-onboarding--setup-checklist)) — a tenant should add real officer coverage before promoting Nearby Help to farmers, since an empty state on first use is a bad first impression for a paid module.

| Route |
|---|
| `/nearby-help` |
| `/field-officers/[id]` |

### 4.7 Field Mapping

GPS-based farm boundary drawing tool (Leaflet), area/perimeter calculation, simulated health/NDVI/moisture/risk analysis. Persistence of `FieldData` becomes tenant/customer-scoped server-side storage (currently local-only) — a fast-follow rather than MVP-blocking, since the underlying UI is already built.

| Route |
|---|
| `/field-mapping` |

### 4.8 AI Chatbot — RAG

> **Business plan feature** — locked/preview below Business, see [2.3.1b](#231b-lockedupgrade-preview-state). Stated inline for the same reason as [4.6](#46-nearby-help--agents).

Floating widget + dedicated page. Replaces the current bare OpenAI proxy (`app/api/chat/route.ts`, explicitly marked temporary in its own comments) with retrieval-grounded answers scoped to the visiting tenant's uploaded documents.

**Mandatory disclaimer.** Before the first message in any new chat session, the widget displays a one-time, dismissible disclaimer ("AgroSphere AI provides general information based on this company's documents and is not a substitute for professional agronomic advice — consult a licensed applicator or field officer before applying any product") and records `disclaimerAcknowledgedAt` on the `ChatSession`. See [5.14.2](#5142-ai-advice-disclaimer--consent-policy).

**Guest usage and identity.** Both guests and logged-in customers can use the chatbot — `/chatbot` is explicitly "Public" in the route map ([4.11](#411-user-side-route-map)). A guest is identified by a client-issued `anonymousId` cookie (a signed UUID, set on first interaction, `ChatSession.anonymousId`, [0.6](#06-core-data-model)) — the same mechanism the cart already uses for guest identity ([4.1](#41-authentication)'s cart-merge pattern), now extended to chat/diagnosis rather than being a gap unique to this module. This `anonymousId` is what the guest rate-limit key in [5.6a](#56a-guest-identity-for-ai-rate-limiting) actually keys on, and what the disclaimer-acknowledgment persistence ("don't show the disclaimer again this session") is tied to for a guest with no `userId`. If a guest later signs up/logs in, their `anonymousId`-keyed chat history is **not** automatically merged into their new account (unlike the cart, which explicitly does merge) — a deliberate, narrower scope decision, since chat history merge raises its own data-ownership questions not worth solving at MVP; the guest simply starts a fresh, authenticated session going forward.

**UI states**: **collapsed/idle** (the floating widget's default state — a small icon, not an open panel, so it doesn't obstruct the storefront); **loading** (the disclaimer or the very first widget open shows a lightweight skeleton, not a spinner-only blank panel, matching [5.9](#59-hosting--dns)'s stated design-for-latency approach); **streaming** (tokens render progressively per the streaming requirement above, with a subtle typing-indicator style cue while the first token is still in flight — the gap between "message sent" and "first token" is the one moment with no visible progress otherwise); **rate-limited** (the widget shows the specific reason — "Daily limit reached, try again tomorrow" for a tenant-wide cap vs. "You've sent a lot of messages — please wait a moment" for a per-session throttle — rather than a single generic "try again later" for both distinct causes); **toggled-off** (per [3.11.6](#3116-chatbot-live-toggle), the widget is not rendered at all, not shown disabled — there is no "chat is currently unavailable" state visible to a farmer, since the tenant chose not to expose it).

**End-to-end request flow**

```
Customer message → Embed query → pgvector similarity search WHERE tenantId (raw SQL, RLS-backed)
  → Top-k chunks + tenant system prompt (with disclaimer) → LLM completion → Answer + source citation
```

| Route |
|---|
| `/chatbot` |
| `/api/chat` |

### 4.9 Disease Diagnosis

> **Business plan feature** — locked/preview below Business, see [2.3.1b](#231b-lockedupgrade-preview-state).

New module. Photo upload → Kindwise `crop.health` API → structured disease/confidence/treatment result → matched against that tenant's Product catalog by role tag → farmer-facing recommendation. Same guest-identity mechanism as [4.8](#48-ai-chatbot--rag) (`DiagnosisRequest.anonymousId`, [0.6](#06-core-data-model)) — a guest can use diagnosis without an account, keyed the same way for rate-limiting and disclaimer persistence.

**Mandatory disclaimer and confidence floor.** Before the first diagnosis request in a session, the same disclaimer pattern as [4.8](#48-ai-chatbot--rag) applies (`disclaimerAcknowledgedAt` recorded on `DiagnosisRequest`). Additionally, **a platform-wide minimum confidence threshold gates whether a product is ever recommended**: results below the threshold set `belowConfidenceThreshold = true` and the UI shows only the raw diagnosis/treatment guidance plus a prominent "Talk to a Field Officer" CTA — no "Add to Cart" surface at all, regardless of tenant configuration. This closes the highest-liability path identified in review: recommending a specific purchasable chemical off a low-confidence ML classification. See [5.14.2](#5142-ai-advice-disclaimer--consent-policy).

**End-to-end request flow**

```
Upload photo → Cloudinary (signed delivery) → Kindwise API call → {disease, confidence, treatment}
  → confidence ≥ threshold? → Match tenant Product by role tag → Save DiagnosisRequest → Show result [+ Add to Cart]
  → confidence < threshold → Show diagnosis/treatment only + "Talk to a Field Officer" CTA (no product surface)
```

If confidence clears the threshold but no matching product exists in that tenant's catalog, the result still shows the diagnosis/treatment guidance behind the same disclaimer, with a "Talk to a Field Officer" fallback rather than recommending nothing — this no-match path is treated as equally liability-sensitive as the recommendation path, not less, since it delivers ungrounded free-text advice with no tenant product-mapping review applied at all.

| Route |
|---|
| `/api/diagnose` |

### 4.10 Profile & Order History

Name, email, member since, order history (new — did not exist before), saved field-mapping data, saved wishlist. Each past order offers a **downloadable invoice/tax PDF** ([3.14.3](#3143-invoice--tax-document-generation)) and a **"Reorder"** action that pre-fills the cart with the same line items and quantities ([3.14.6](#3146-bulk-reorder)).

**4.10.1 Email Change**
A farmer can change their account email from `/profile`. The new address must re-verify (same signed-token pattern as [4.1](#41-authentication)'s "Email verification") before it takes effect, and is re-checked for uniqueness against the `(email, tenantId)` constraint ([0.6](#06-core-data-model)) — a change is rejected if the new email already has an account on that same tenant. The old email remains active until the new one is verified, so the account is never left unreachable mid-change.

**4.10.2 Self-Service Account Deletion (GDPR Erasure)**
Distinct from the tenant-deletion-triggers-farmer-export flow in [2.2.3](#223-suspend--reactivate--delete) — that flow covers what happens to farmer data when a *tenant* is deleted; this covers a *farmer* requesting deletion of their own account while the tenant they bought from remains fully active. This is GDPR Article 17 (right to erasure), distinct from Article 20 (portability), which the tenant-deletion flow already addresses.

A "Delete my account" action on `/profile` triggers: the customer's `User` row and any directly-identifying PII (name, email, saved addresses) are anonymized/deleted; `Order`/`OrderItem` rows are **retained** (not deleted) with the PII reference removed, since the tenant has a legitimate business/legal basis (accounting, tax records, dispute evidence) to keep transaction records — the same pattern used by Shopify and comparable commerce platforms: erase personal identity, retain the transaction. `ChatMessage`/`DiagnosisRequest` rows tied to that customer are similarly anonymized rather than deleted outright, preserving the moderation/audit value of that history without retaining the farmer's identity. The action is irreversible and requires typed confirmation, mirroring the tenant-deletion confirmation pattern in [2.2.3](#223-suspend--reactivate--delete).

| Route |
|---|
| `/profile` |

### 4.11 User-Side Route Map

| Route | Access | Module |
|---|---|---|
| `/` | Public | 4.2 |
| `/login` | Public | 4.1 |
| `/signup` | Public | 4.1 |
| `/verify-email/resend` | customer (auth required), rate-limited | 4.1 — closes a gap where the email-verification "resend" action had no concrete route anywhere in the document |
| `/products` | Public | 4.3.1 |
| `/products/[id]` | Public | 4.3.2 |
| `/cart` | Public (persisted if logged in) | 4.3.3 |
| `/checkout` | customer (auth required) | 4.3.4 |
| `/checkout/success` | customer | 4.3.4 |
| `/precision-dose` | Public | 4.4 |
| `/case-studies` | Public | 4.5 |
| `/case-studies/[id]` | Public | 4.5 |
| `/nearby-help` | Public, rate-limited *(Standard+ plan; locked preview below it)* | 4.6 |
| `/field-officers/[id]` | Public, rate-limited *(Standard+ plan)* | 4.6 |
| `/field-mapping` | Public (save requires auth) | 4.7 |
| `/chatbot` | Public, disclaimer-gated *(Business plan; locked preview below it)* | 4.8 |
| `/api/diagnose` | Public (guest or auth), disclaimer-gated *(Business plan)* | 4.9 — previously missing from this table entirely |
| `/profile` | customer (auth required) | 4.10 |

---

## 5. Cross-Cutting Concerns

### 5.1 Redirect & Guard Logic

All of the following is centralized in a single `middleware.ts`, scoped by an explicit matcher (see [5.1.7](#517-middleware-matcher-scope)), so redirect behavior is defined once and applies identically across all three systems — but middleware is treated as the **first** line of defense for UX, never the sole enforcement layer. See [5.1.5](#515-defense-in-depth-against-middleware-bypass).

**5.1.1 Tenant Resolution (runs first, on every request)**

Executed as an explicit sequential pipeline, evaluated fresh on every request (never assumed from a prior navigation in the same browser session):

1. Read `host` header.
2. If host is the root domain with no subdomain (`agrosphere.com`) → serve the Marketing Site ([1](#1-marketing-site)), the one route tree with no tenant context; the single exception is `/super-admin/*`, which performs a pure 302 redirect to the canonical `admin.agrosphere.com/super-admin/login` rather than hosting parallel local logic (see [2.1.1](#211-login)).
3. If host is `admin.agrosphere.com` → route into the Super Admin system exclusively; no tenant context is set.
4. Otherwise, extract the subdomain (e.g. `bayer`) and resolve it via the **cached** lookup described in [5.10.1](#5101-tenant-resolution-cache) — `{subdomain → tenantId, status, plan, chatbotEnabled}`.
5. Unknown subdomain → render a "no such company" 404 page (not a generic Next.js 404 — tenant-aware messaging), and **proactively clear any stale auth cookie** present on the request, since subdomains are never reissued but a very old session cookie should never be allowed to linger indefinitely.
6. Known subdomain with `status = suspended` → render a maintenance/suspended page on every route, **except** the billing-recovery and read-only order-fulfillment exemptions listed in [2.2.3](#223-suspend--reactivate--delete).
7. Known + active subdomain → attach `tenantId` to request context for the rest of the pipeline; downstream route handlers and server components **re-derive this from the verified session independently** rather than trusting it as a passed-through header (see [5.1.5](#515-defense-in-depth-against-middleware-bypass)).

**5.1.2 Auth Guards**

Guards run in strict sequence: tenant resolution/suspension ([5.1.1](#511-tenant-resolution-runs-first-on-every-request)) → session validation → tenant-match check → role check → MFA check → email-verification check (see [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts) and [5.1.11](#5111-mfa--email-verification-guard-integration) for how the two newest guard dimensions integrate into this exact sequence). Each is a hard gate evaluated before any tenant-scoped data query executes — see [5.1.6](#516-session-freshness--revocation-policy) for how "wrong role" is enforced server-side, not just cosmetically.

| Path prefix | Unauthenticated | Wrong role | Wrong tenant |
|---|---|---|---|
| `/super-admin/*` | → `/super-admin/login` | → 403 page | n/a (no tenant context) |
| `/dashboard/*` | → `/dashboard/login` | Blocked **before any query executes** at the route-handler/server-component layer; UI shows an "insufficient permission" toast as cosmetic feedback on top of that hard block, never as the only gate | Session's tenantId ≠ resolved subdomain tenantId → immediate force logout (session invalidated, not just redirected) + redirect to that subdomain's `/dashboard/login` |
| `/checkout` | → `/login?redirect=/checkout` (validated per [5.1.9a](#519a-open-redirect-prevention)) | n/a | **Same force-logout-and-invalidate response as `/dashboard/*`** — a session whose tenantId doesn't match the resolved subdomain is force-invalidated immediately, not merely relied upon to fail the cart-scoping check. Previously this row only stated the cart-*data* consequence ("cart items scoped to session tenant only"), leaving the *session itself* unaddressed for this edge case — an asymmetry with `/dashboard/*` that is now closed: every route in this table applies the identical session-invalidation response to a wrong-tenant session, not just the dashboard. |
| `/profile` | → `/login?redirect=/profile` (validated per [5.1.9a](#519a-open-redirect-prevention)) | n/a | Same force-logout-and-invalidate response as above — closes the same asymmetry for profile-data exposure risk. |

**MFA and email-verification, as explicit guard rows.** Neither was previously wired into this table despite [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts) describing MFA as a "hard gate" — that claim is only true if it's enforced here, so it is now stated as an explicit fifth and sixth guard dimension, evaluated after role check per [5.1.2](#512-auth-guards)'s pipeline order:

| Path prefix | MFA not enabled (where required) | Email not verified |
|---|---|---|
| `/super-admin/*` | **Hard block on the entire route tree.** `platform_owner`/`platform_staff` without MFA enrolled are redirected to `/super-admin/mfa-setup` on every request until enrolled — no `/super-admin/*` route is reachable, including `/super-admin` itself, until MFA is set up. This is the concrete mechanism behind [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts)'s "mandatory" language. | n/a — platform accounts are seeded/invited directly, not self-signup, so email verification doesn't apply the way it does to storefront signup. |
| `/dashboard/billing`, staff-removal actions | `tenant_owner` without MFA enrolled is redirected to `/dashboard/account` (MFA setup) with a clear explanation, specifically when accessing these two sensitive surfaces — the concrete mechanism behind [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts)'s "strongly enforced... before Stripe Connect settings or staff-removal actions become available." Every other `/dashboard/*` route remains reachable without MFA (a soft nudge banner only, not a hard gate) — the "strongly enforced" language applies narrowly to these two surfaces, not the whole dashboard, stated explicitly here rather than left ambiguous. | n/a — staff accounts are invited, not self-signup. |
| `/checkout`, `/profile` | n/a — MFA is not required for customer accounts at MVP. | **Not a hard gate** ([4.1](#41-authentication)'s "Email verification" already states checkout is not hard-blocked) — a persistent, dismissible banner only. Stated here explicitly as a confirmed non-gate, closing a gap where 5.1's guard table gave no answer either way and a reader auditing this section specifically could not confirm the non-gating decision without cross-referencing 4.1. |

**5.1.11 MFA & Email-Verification Guard Integration**
Both checks above execute as steps 5 and 6 of the same sequential pipeline stated in [5.1.2](#512-auth-guards) — after tenant-match and role checks, before any tenant-scoped data query. Neither is a middleware-only check: consistent with [5.1.5](#515-defense-in-depth-against-middleware-bypass)'s defense-in-depth principle, the MFA-required-but-not-enabled state and the email-verification state are both re-derived from the verified session/user record inside the route handler itself, not trusted from a middleware-set header.

**5.1.3 Post-Login Redirects**

- Customer login with a `?redirect=` param → send back to that original page (e.g. checkout), **only after the target has passed the open-redirect validation in [5.1.9a](#519a-open-redirect-prevention)**.
- Customer login with no redirect param → `/`.
- Staff login → `/dashboard` (or `/dashboard/setup` if onboarding checklist incomplete).
- Platform staff login → `/super-admin`.

**5.1.4 Cookie & Session Scoping Policy**

A prior design left this implicit, and the implicit/default "fix" for wildcard-subdomain auth (setting a shared cookie `domain: '.agrosphere.com'`) is a well-documented cause of cross-subdomain cookie leakage and duplicate-cookie bugs in NextAuth. The explicit policy:

- **No shared cookie domain is ever set.** Session cookies default to host-only scoping (the NextAuth default when `domain` is left unset) — a cookie set on `bayer.agrosphere.com` is never sent to `syngenta.agrosphere.com` or `admin.agrosphere.com`. This is the *correct* behavior here, since tenant isolation, not cross-subdomain SSO, is the requirement.
- `admin.agrosphere.com` uses a **distinct NextAuth cookie name/prefix** from tenant-scoped storefront/dashboard cookies, so a platform session structurally cannot be confused with or replayed against a tenant session even under a future configuration mistake.
- Cookies are `Secure`, `SameSite=Lax` by default (`Strict` is evaluated per-route where it doesn't break legitimate cross-site navigation into checkout flows from payment redirects).

**5.1.5 Defense-in-Depth Against Middleware Bypass**

Treating `middleware.ts` as the *sole* enforcement layer is a known-risky pattern — a documented 2025 Next.js middleware vulnerability (CVE-2025-29927, patched in the versions this project targets) showed that a spoofed internal header could cause middleware to be skipped entirely, bypassing auth, tenant resolution, and role checks in one shot for any application relying on it as the only gate. The architectural lesson is treated as a standing requirement, not just a patched CVE to forget about:

- Every route handler and server component **independently re-derives `tenantId` and role from the verified session** inside the request itself — never trusting a middleware-set request header as the source of truth. This is the same principle stated in [0.7](#07-data-isolation-policy)'s Layer 1 policy.
- The tenant-scoping Prisma helper (`lib/tenant.ts`) re-resolves `ctx.tenantId` from the authenticated session server-side on every call.
- If a reverse proxy is ever placed in front of Vercel, `x-middleware-subrequest` and similar internal headers are stripped from client-supplied input as an additional defense-in-depth measure, even though Vercel's own deployment was not affected by the original CVE.

**5.1.6 Session Freshness & Revocation Policy**

Consolidates what was previously three separately-underspecified concerns (tenant suspension, staff role change, password reset) into one policy, since they share the same underlying mechanism:

- **Session strategy is database-backed** (NextAuth database sessions), not pure JWT — see [0.2](#02-technology-stack). This is required because plan downgrades, tenant suspension, and role changes must all take effect immediately, which a long-lived JWT cannot guarantee without a per-request revocation check layered on top anyway.
- `Tenant.status` and `Tenant.plan` are read from the short-TTL cache described in [5.10.1](#5101-tenant-resolution-cache) on every request, never embedded in a long-lived session token.
- `User.sessionVersion` (see [0.6](#06-core-data-model)) is incremented on: password reset, staff role change, staff removal. The session is validated against this version on every request; a mismatch forces immediate re-authentication.
- **Net effect**: a suspended tenant's staff, a demoted/removed staff member, and a farmer whose password was just reset all lose their old access on their very next request — never at "next token refresh," which could otherwise be hours or days away.

**5.1.6a Multi-Factor Authentication for Privileged Accounts**

Absent from the original design — a real gap given `platform_owner` has unrestricted access to every tenant's data (via impersonation, [2.2.2a](#222a-impersonation-security-model)) and full platform billing control, and `tenant_owner` controls Stripe Connect settings and can remove staff. Password-only auth on the account classes that touch payment configuration is below the bar every comparable platform (Stripe, Shopify, Vercel) holds for this class of account.

- **TOTP-based MFA** (industry-standard: Google Authenticator/Authy-compatible, not SMS — SMS OTP is a known-weaker pattern due to SIM-swap risk). `User` gains `mfaEnabled: boolean` and `mfaSecret: string, nullable, encrypted at rest` (same encryption standard as [5.7](#57-per-tenant-secrets)'s tenant-secret storage).
- **Mandatory** for `platform_owner` and `platform_staff` — enforced at `/super-admin/login`, cannot be skipped or deferred, given the blast radius of a compromised platform account.
- **Strongly enforced for `tenant_owner`** — required before Stripe Connect settings or staff-removal actions become available, even if the account was created without MFA initially (a soft nudge at every login until enabled, then a hard gate specifically in front of `/dashboard/billing` and staff-removal). `tenant_admin` and scoped staff roles are not required to enable MFA at MVP, but the option is available to all roles.
- **MFA reset/disable** follows the same session-freshness mechanism as everything else in this section: disabling or resetting MFA increments `User.sessionVersion`, immediately invalidating any other active session for that account — closing the obvious bypass where an attacker who compromises a session could otherwise silently disable MFA and retain access indefinitely.

**5.1.7 Middleware Matcher Scope**

`middleware.ts` uses an explicit `matcher` configuration, not the unscoped default that runs on every path:

- **Excluded** from all tenant/auth/suspension middleware logic: `_next/static/*`, `_next/image/*`, `favicon.ico`, common static file extensions, and — critically — **all of `/api/webhooks/*`**. Webhook routes (Stripe) authenticate via signature verification against the raw request body, not session/tenant middleware, and must never be subject to tenant-resolution or suspended-tenant redirect logic; a webhook arriving for a tenant whose status happens to read as non-active at that instant must still reach the handler, not be redirected to a maintenance page.
- **Included**: every other application route, including all three systems' page routes and all tenant-scoped API routes.

**5.1.8 Fast-Follow: Renameable Route Slugs**

Post-MVP mechanism (not built at launch): a catch-all route `app/[slug]/page.tsx` resolves the incoming slug against that tenant's `PageConfig.slug` mapping to find the internal `pageKey`, then renders the matching coded page component. All internal links move from hardcoded `href="/products"` to a `getPageUrl("products")` helper that resolves the tenant's current slug at render time. Slug uniqueness is enforced per tenant at the database level.

**5.1.9 Password Reset Flow**

Not previously specified; now fully defined given the `(email, tenantId)` scoping decision in [0.6](#06-core-data-model):

1. Reset request on a tenant's `/login` page is scoped to the tuple `(email, tenantId-from-current-subdomain)` — a reset request on `bayer.agrosphere.com` can only ever target a Bayer-tenant account with that email, never a same-email account on a different tenant. Platform (`/super-admin`) reset requests are scoped by email alone, since platform accounts have no `tenantId`.
2. Reset tokens are single-use and expire after 1 hour, delivered via Resend.
3. A successful reset increments `User.sessionVersion`, invalidating every other active session for that account immediately (closes the "stolen-then-reset account still has the attacker's old session valid" gap).
4. Rate-limited per [5.6](#56-rate-limiting--upstash-redis).

**5.1.9a Open Redirect Prevention**

Every `?redirect=` parameter accepted anywhere in the application (login, signup, staff invite acceptance) is validated before use: the target must match `^\/(?!\/)` — a single leading slash, explicitly rejecting anything starting with `//` (protocol-relative URLs that many naive `startsWith('/')` checks miss) or containing a scheme (`http:`, `javascript:`, etc). A value that fails validation is discarded and the default post-login destination is used instead. This closes a real phishing vector where a crafted `?redirect=//evil.com` link could bounce a just-authenticated farmer to a lookalike site.

**5.1.10 CSRF Policy**

NextAuth's built-in CSRF protection covers only its own `/api/auth/*` routes. All custom state-changing route handlers — checkout session creation, staff invite acceptance, Stripe Connect account linking — independently verify the request's `Origin`/`Referer` header against the resolved tenant's subdomain before processing, in addition to relying on `SameSite=Lax` cookies as a baseline defense.

### 5.2 Payments — Stripe Connect (Express)

```
Tenant approved → Stripe Express onboarding link → Tenant completes KYC on Stripe
  → stripeOnboardingComplete = true → Checkout enabled
```

At storefront checkout, a Stripe Checkout Session is created with `transfer_data.destination` set to that tenant's `stripeConnectAccountId` (a **destination charge**), so funds settle directly into the company's own Stripe balance.

**5.2.1 Liability Model — Corrected**

A prior version of this document stated "AgroSphere never custodies farmer payments" as if that also meant zero platform liability. That is true for the *funds flow* but **false for dispute/chargeback liability**: under Stripe's Connect model for destination charges on Express accounts, **the platform is ultimately liable for disputes and negative connected-account balances** — Stripe debits the connected account's balance first, but if that balance can't cover a chargeback (a small company with thin margins, or one recently suspended), the platform absorbs the loss. This is now treated as an explicit, budgeted business risk rather than an assumed non-issue.

**5.2.2 Dispute, Chargeback & Reserve Policy**
- `charge.dispute.created`/`.updated`/`.closed` webhooks are handled, updating the affected `Order.status` to `disputed` and populating the Finance dashboard's dispute log ([3.5.3](#353-finance--revenue)) with the response deadline (Stripe disputes carry a fixed 7–21 day response window).
- Tenants are responsible for responding to disputes on their own orders (evidence submission) within the platform-surfaced deadline; the platform's role is visibility and escalation, not response on the tenant's behalf.
- `Tenant.stripeReserveTier` drives a rolling-reserve policy: new or higher-risk tenants (recently onboarded, thin transaction history, or a rising dispute rate) have a percentage of each payout held in reserve for a defined window, reducing the platform's exposure to a negative-balance scenario. Reserve tier is reviewed periodically based on dispute-rate and account-age signals.

**5.2.3 Account Restriction / Deauthorization Handling**
`account.updated` (watching `capabilities.transfers`/`charges` status and `requirements.disabled_reason`) and `account.application.deauthorized` webhooks are handled explicitly: on either event, `Tenant.stripeOnboardingComplete` is flipped to `false`, the "Stripe not connected" dashboard banner ([5.1](#51-redirect--guard-logic)-style onboarding gate) re-triggers automatically, checkout is disabled for that tenant until resolved, and the tenant owner is notified via Resend. Without this, a restricted account would otherwise fail checkout silently with no tenant-side visibility into why.

**5.2.4 Webhook Idempotency & Deduplication**
Stripe guarantees only *at-least-once* delivery — the same event can legitimately arrive more than once even with no failure (a dashboard "Resend," a network retry on Stripe's side). This is a distinct problem from retry-on-failure, which Inngest already handles. Every incoming webhook's `event.id` is checked against the `StripeWebhookEvent` table (unique constraint on `event.id`) **before** any state mutation; a duplicate delivery is recognized and skipped, never re-triggering an order-status transition or a duplicate confirmation email.

**5.2.5 Tax Calculation & Remittance**
Stripe Tax is integrated at the Checkout Session level, calculating applicable sales tax/VAT/GST based on the farmer's shipping jurisdiction and the tenant's registered tax locations. Given the unresolved legal question of whether a platform architected this way qualifies as a "marketplace facilitator" under various jurisdictions' tax law (which would shift remittance obligation onto the platform), the tenant Terms of Service explicitly assigns **tax remittance responsibility to the tenant as seller of record**, while the platform provides correct tax calculation at the point of sale regardless. This scope is flagged for a proper legal review before scaling into any specific new market with materially different tax rules.

**5.2.6 Take-Rate Collection Mechanism**

> The technical implementation the policy in [2.3.1c](#231c-take-rate-on-payment-processing) previously lacked — stated there as a pricing decision with no stated collection path, closed here.

The 0.5% platform take-rate is collected via Stripe Connect's native **`application_fee_amount`** parameter, set on the same destination-charge Checkout Session already used for the tenant's order ([this section's own opening](#52-payments--stripe-connect-express)) — not a separate transaction, not a monthly true-up invoice. Concretely: when the Checkout Session is created with `transfer_data.destination` set to the tenant's Connect account (the existing mechanism), `payment_intent_data.application_fee_amount` is set to 0.5% of the order subtotal — Stripe automatically routes that slice to the **platform's own Stripe balance** at settlement, and the remainder to the tenant's connected account, in a single atomic charge. This is the standard Stripe Connect pattern for platform fees on destination charges, not a custom mechanism.

- **`Order.applicationFeeAmount`** ([0.6](#06-core-data-model)) records the exact fee captured per order, feeding [2.3.2](#232-usage-metering)'s GMV/take-rate accrual tracking.
- **Refund interaction, previously unaddressed.** A full refund ([6.11](#611-refund-initiation)) reverses the platform's `application_fee_amount` **proportionally** — Stripe's refund API supports `refund_application_fee: true` on the refund call, which is set by default for every refund initiated through [6.11](#611-refund-initiation), so the platform does not keep its 0.5% on an order that was fully reversed. A **partial** refund reverses the application fee proportionally to the refunded amount, not the full fee — e.g. a 50%-value partial refund reverses 50% of that order's platform fee. This is now stated explicitly in [6.11](#611-refund-initiation)'s own flow steps as well, not left as an unaddressed interaction between two features that both existed but were never reconciled.

**5.2.7 Testing Strategy**
Stripe Connect onboarding, checkout, and webhook flows are explicitly tested pre-launch against a real Stripe test-mode Connect platform with multiple simulated connected accounts in varied states (fully onboarded, restricted, deauthorized) — not solely unit tests against mocked responses, since capability-requirement enforcement in Stripe's newer Sandboxes model does not always mirror production behavior exactly.

### 5.3 Background Jobs — Inngest

- RAG document embedding pipeline ([3.11.2](#3112-embedding-pipeline-background)), broken into small batched steps per document (page-batch extraction, batched chunking, batched embedding/writes) so a large PDF cannot exceed any single step's duration budget.
- Order status change → customer email notification (deduplicated per [5.2.4](#524-webhook-idempotency--deduplication)).
- Stripe webhook processing.
- Tenant onboarding email sequence.
- Scheduled: monthly usage rollup for billing ([2.3.2](#232-usage-metering)).
- Scheduled: AI cost-anomaly check ([5.11.2](#5112-ai-cost-anomaly-alerting)).

Inngest event payloads carry an explicit version (e.g. `document/embed.requested.v1`) since these jobs cross deploy boundaries asynchronously — an in-flight job started under old code must not misinterpret a new payload shape after a mid-flight deploy, even though the synchronous REST API surface stays unversioned at MVP (internal-only consumer).

### 5.4 File Storage — Cloudinary

All images and documents: product photos, tenant logos/favicons, case-study before/after images, field-officer photos, RAG source documents, diagnosis request photos. Organized by tenant-scoped folder path (e.g. `/tenants/{tenantId}/products/...`) for operational clarity.

**Access control policy (previously acknowledged as a gap, now resolved):** genuinely public assets (product photos, case-study images, logos) use standard unsigned Cloudinary delivery. Assets that could expose tenant-private or farmer-private information — `TenantDocument` (RAG source documents, which may include internal company policy) and `DiagnosisRequest` images (a farmer's own crop photo) — use **Cloudinary's signed/authenticated delivery type**, so a leaked URL (via referrer header, browser history, or log line) cannot expose another tenant's private content, since Cloudinary itself has no concept of `tenantId` and application-layer authorization is therefore the only thing that can gate access to these specific assets.

**5.4.1 Storage Quota Enforcement**

> Previously metered but never enforced — [2.3.1a](#231a-feature-gating-matrix)'s storage caps (2GB/10GB/50GB) had a tracked counter with no upload path actually checking it. Closed here.

Every upload path — Product images ([3.3.2](#332-create--edit-product)), Case Study images ([3.7.1](#371-case-study-editor)), Theme assets ([3.10.1](#3101-brand--theme-tokens)), RAG Documents ([3.11.1](#3111-document-upload)) — checks `Tenant.storageUsedBytes` ([0.6](#06-core-data-model)) against the plan's cap **before** the file is accepted (a pre-flight check against the file's declared size, confirmed against the actual uploaded size once Cloudinary returns it, with `storageUsedBytes` incremented atomically on confirmed upload and decremented atomically on delete/archive across all four upload paths). A request that would exceed the cap is rejected at the API layer with a clear "storage limit reached — upgrade your plan or remove unused files" message, before any Cloudinary upload call is even made, rather than accepting the upload and failing/drifting silently later.

### 5.5 Email — Resend

Local development uses Resend's sandbox domain (`onboarding@resend.dev`), which only delivers to the developer's own verified address — sufficient for testing every email flow below without a live domain. Production requires a verified sending domain before launch.

- Staff invitation (dashboard)
- Tenant onboarding sequence (platform)
- Order confirmation / status change (storefront)
- Password reset (all three systems, via NextAuth, per [5.1.9](#519-password-reset-flow))
- Platform billing receipts/dunning
- Stripe account restriction/deauthorization alerts ([5.2.3](#523-account-restriction--deauthorization-handling))
- Impersonation notification to tenant owner ([2.2.2a](#222a-impersonation-security-model))
- AI cost-anomaly alerts to platform staff ([5.11.2](#5112-ai-cost-anomaly-alerting))

### 5.6 Rate Limiting — Upstash Redis

`@upstash/ratelimit`, sliding-window algorithm, enforced in `middleware.ts` at the edge for general abuse throttling. Keys combine `tenantId` + `userId`/IP.

**Hard cost-cap distinction.** Edge-distributed rate-limit counters can under-enforce a strict per-tenant daily spend cap, since traffic routed through different edge regions can maintain loosely-synced counters. For the specific case of capping real AI vendor spend (OpenAI/Kindwise calls, which cost real money per call and are metered against plan tier per [2.3.2](#232-usage-metering)), the check is **also reconciled against a centralized Redis counter, checked server-side immediately before the paid vendor call fires** — not relying solely on the edge-distributed count. General abuse throttling (login attempts, scraping deterrence) continues to use the standard edge-distributed sliding window, where minor under-enforcement is an acceptable tradeoff for latency.

**5.6a Guest Identity for AI Rate-Limiting**
"Per customer session" in the table below is precisely defined, not left ambiguous for the unauthenticated case: an authenticated customer's key is `userId`; a guest's key is the client-issued `anonymousId` cookie described in [4.8](#48-ai-chatbot--rag)/[4.9](#49-disease-diagnosis) (a signed UUID, the same mechanism the cart already uses for guest identity, [4.1](#41-authentication)) — never a bare, unkeyed "per customer session" that silently falls through to only the tenant-wide daily cap for anonymous traffic. This closes a gap where guest rate-limiting had no defined mechanism despite guests being an explicitly supported case at the data-model level (`DiagnosisRequest.userId`/`anonymousId` both nullable-or-present, [0.6](#06-core-data-model)).

| Endpoint | Limit basis |
|---|---|
| `/api/chat` | Per customer session (`userId` or `anonymousId`, see [5.6a](#56a-guest-identity-for-ai-rate-limiting)) + per tenant daily cap (server-reconciled cost cap tied to plan tier, [2.3.1](#231-plan-tiers)) |
| `/api/diagnose` | Per customer session (`userId` or `anonymousId`) + per tenant daily cap (server-reconciled Kindwise credit cost) |
| `/login`, `/signup`, `/dashboard/login`, `/super-admin/login` | Per IP **and** per-account progressive backoff — IP-only limiting is insufficient against distributed credential stuffing |
| `/super-admin/mfa-setup`, TOTP verification attempts | Per account, progressive backoff after 5 failed attempts — closing a gap where 6-digit TOTP codes (a classic brute-force target) had no stated limit despite MFA being mandatory for the highest-privilege account class in the system |
| Password reset request/confirm | Per IP and per email address |
| `/verify-email/resend` | Per IP and per email address — closing a gap where this action (a real abuse/spam vector, since an attacker could spam sends to an arbitrary address) had no stated limit, unlike the structurally identical password-reset case |
| `/nearby-help`, `/field-officers/[id]` | Per IP — deters bulk scraping of field-officer contact data |
| Product review submission | Per customer per product (already asserted in [3.3.3a](#333a-review-integrity); listed here too so this table is the actually-complete reference it claims to be, not a partial one a reader has to cross-check against module text) |
| `/dashboard/orders/[id]` refund action | Per staff account — closing a gap where refund initiation, a real-money action, had no stated throttle unlike password reset or login |
| `/contact` (Marketing Site) | Per IP, plus bot-filtering challenge — see [1.6](#16-contact--sales) |

### 5.7 Per-Tenant Secrets

Tenant-scoped credentials — `stripeConnectAccountId`, and any future tenant-specific API keys — stored encrypted at rest in the database (application-level encryption, not OS environment variables), scoped by `tenantId`, decrypted only within request handlers that already hold a valid tenant context. Distinct from platform-level secrets (OpenAI key, Kindwise key, Resend key, Cloudinary credentials), which remain standard Vercel environment variables shared across all tenants.

### 5.8 Data Isolation Policy

See [0.7](#07-data-isolation-policy) — placed in the Overview section since it is foundational to every module in this document, not a peripheral cross-cutting concern.

### 5.9 Hosting & DNS

Vercel is the deployment target. **Wildcard subdomain SSL requires the root domain's nameservers to point to Vercel** — automatic Let's Encrypt DNS-01 wildcard certificate issuance does not work through third-party DNS/WAF layers (e.g. Cloudflare in front) without per-tenant manual domain verification via the Vercel API. This is resolved as a deployment decision before build begins: if a third-party DNS/WAF layer is required for other reasons, the fallback is scripted per-tenant domain registration via the Vercel API rather than relying on wildcard auto-provisioning.

**Function duration.** `/api/chat` and `/api/diagnose` both make synchronous calls to external AI vendors on the customer-facing request path; `maxDuration` is set explicitly per route (not left at the platform default), and independent timeouts/retries are wrapped around the OpenAI and Kindwise SDK calls so a vendor latency spike degrades gracefully rather than producing an opaque platform-level timeout.

### 5.10 Caching Strategy

**5.10.1 Tenant Resolution Cache**
Tenant resolution (subdomain → tenant identity/status/plan) happens on literally every request via middleware — this was previously uncached, making it the single highest-frequency database hit in the entire system. `{subdomain → tenantId, status, plan, chatbotEnabled}` is cached in Upstash Redis (already in the stack for rate limiting) with a 30–60 second TTL, plus **active invalidation** fired directly from the specific dashboard/super-admin actions that change these values (suspend, plan change, chatbot toggle) — so correctness-sensitive state (a just-suspended tenant should stop serving quickly) does not depend solely on TTL expiry. This also resolves the standard-Prisma-on-Edge-runtime limitation, since the cached lookup avoids needing a full database client inside middleware at all.

**5.10.2 CMS/Theme Content Cache**
`TenantTheme`, `PageConfig`, and `SectionContent` are read on every storefront page render but change only when a tenant explicitly saves CMS edits — a natural fit for Next.js's built-in tag-based revalidation. Cached via `revalidateTag` keyed by `tenantId`, explicitly invalidated when a tenant saves changes in [3.10.2](#3102-page--section-content-editor), rather than left as an uncached per-render database round-trip.

### 5.11 Observability & Monitoring

Not present in the original design; treated as a launch requirement given this platform handles payments, PII, and metered AI cost exposure across many tenants.

**5.11.1 Error Tracking & Structured Logging**
Sentry (or equivalent) captures errors with `tenantId` as a required tag/context on every event, so a bug affecting one tenant is queryable and alertable rather than lost in aggregate noise. Structured JSON logs carry a request ID and tenant ID for correlation, which is what makes Stripe webhook and Inngest job failures debuggable in production. An uptime/synthetic check runs against the three highest-value paths specifically: checkout, chat, and diagnose.

**5.11.2 AI Cost Anomaly Alerting**
Usage metering ([2.3.2](#232-usage-metering)) tracks spend for billing purposes but does not by itself catch a runaway-cost incident in real time (a bug causing repeated re-embedding, a chat loop, a compromised account). A scheduled Inngest function compares each tenant's daily OpenAI/Kindwise spend against a rolling baseline and alerts platform staff (Resend) on a significant deviation — a low-cost addition given the metering data already exists.

### 5.12 Backup & Disaster Recovery

Not present in the original design; a hard requirement for a platform holding tenant payment records and each tenant's entire storefront, where a bad migration, an accidental bulk-delete (the tenant-delete flow and the document-chunk cascade-delete are both already-specified actions capable of large deletions), or a provider incident would otherwise have no recovery path beyond the narrow 30-day tenant soft-delete window, which covers only one specific case.

- **Continuous WAL archiving + point-in-time recovery (PITR)** enabled on the Postgres provider.
- **Scheduled logical backups** exported to independent object storage (not solely relying on the primary database provider remaining operational).
- Explicit RPO/RTO targets are documented operationally (recovery point objective and recovery time objective) so an incident has a defined, tested response rather than an improvised one.

### 5.13 AI Vendor Abstraction & Liability

Both AI vendors this platform depends on for paid-tier functionality are single points of failure with no stated fallback in the original design — if Kindwise changes pricing or deprecates an API tier, or OpenAI changes embedding/completion pricing, an entire paid plan tier's functionality and unit economics are affected platform-wide with no mitigation path.

- Vendor-specific logic stays strictly isolated behind `lib/rag.ts` (OpenAI) and `lib/diagnose.ts` (Kindwise) — the rest of the application interacts with these as internal interfaces, never calling vendor SDKs directly from route handlers. This means a second provider can be introduced behind the same interface without a platform-wide rewrite if a vendor's pricing or availability changes materially.
- Vendor pricing and rate-limit terms are monitored as an ongoing operational concern, not assumed stable indefinitely.

### 5.14 Regulatory Compliance — Pesticide Sales

Pesticides are a regulated product category in essentially every jurisdiction this platform could operate in — selling restricted-use products without proper licensing/dealer registration carries real legal liability that extends to the seller, not just the manufacturer. This was entirely absent from the original design and is treated as a launch-blocking scope item.

**5.14.1 Product-Level Regulatory Gating**
Every `Product` carries a `regulatoryClass` (`general_use`/`restricted_use`). A `restricted_use` product cannot be activated on the storefront (`isActive = true`) without a non-null, staff-uploaded `approvedLabelUrl` — a structured label/instructions-for-use document distinct from free-text marketing copy, enforced at the API layer (not just a UI validation a client could bypass). If the product additionally requires applicator credentials, checkout captures a credential reference before payment for that line item — see [4.3.4](#434-checkout).

**5.14.2 AI Advice Disclaimer & Consent Policy**
Both the RAG chatbot ([4.8](#48-ai-chatbot--rag)) and the image diagnosis flow ([4.9](#49-disease-diagnosis)) are structurally different from a generic support chatbot: they can lead directly from an AI-generated output to a specific purchasable chemical product. The policy:
- A one-time, per-session, logged disclaimer is required before the first interaction of either kind, explicitly stating the AI output is informational, not professional agronomic advice, and encouraging consultation with a licensed applicator or the platform's own field-officer network before applying any product.
- The image diagnosis flow additionally enforces a **platform-wide minimum confidence threshold** below which no specific product is ever recommended, regardless of tenant configuration — see [3.12.2](#3122-disease--product-mapping-rules) and [4.9](#49-disease-diagnosis).
- Full diagnosis input/output/confidence and chat transcripts are retained as the evidentiary record for any future dispute, not merely treated as a sales-signal log to be pruned.
- Liability for AI-generated advice is contractually allocated to the tenant (who chose to enable the module and curates the RAG document set) in the tenant Terms of Service, while the platform disclaims warranty on the underlying model output's accuracy — mirroring how comparable agri-AI products in this space structure their own disclaimers.

**5.14.3 Tenant Onboarding Regulatory Review**
Tenants that self-declare they sell restricted-use products go through the additional `regulatoryReviewStatus` review step described in [2.2.1](#221-tenant-onboarding) before those specific product categories can be activated — general (non-restricted) commerce is not blocked while this review is pending.

### 5.15 Data Ownership & GDPR Posture

Farmer PII lives entirely within one tenant's scoped rows under this architecture; the original design had no stated path for what happens to that data if the tenant is deleted, which is both a farmer-facing gap and a real controller/processor ambiguity under GDPR.

- On tenant hard-deletion, affected farmers receive an automatic data-export email before the delete completes — see [2.2.3](#223-suspend--reactivate--delete).
- AgroSphere and each tenant operate under an explicit Data Processing Agreement (DPA) defining controller/processor roles: the tenant is the data controller for its own farmer relationships, AgroSphere is the processor hosting/processing that data on the tenant's behalf. This is a standing legal artifact referenced in tenant onboarding, not something left implicit.

### 5.16 Fraud & Abuse Controls

- **Tenant-level fraud**: onboarding approval includes business-registration verification and a trademark/legitimacy check, not uniqueness-checking alone — see [2.2.1](#221-tenant-onboarding). Dormant tenants (approved, Stripe-onboarded, but near-zero real activity for an extended period) are surfaced as a fraud signal in [2.4.1](#241-cross-tenant-dashboard).
- **Review/rating fraud**: purchase-verified reviews only, rate-limited submission, anomaly detection on rating velocity — see [3.3.3a](#333a-review-integrity).
- **Field-officer PII scraping**: rate-limited public routes, masked contact delivery — see [3.6.3](#363-officer-list--profile-dashboard-view) and [4.6](#46-nearby-help--agents).
- **Catalog spam/quality**: minimum listing-quality validation, suggested controlled vocabulary for role tags — see [3.3.2](#332-create--edit-product).

### 5.17 SLA & Status Page

Not present in the original design. A public status page (e.g. a hosted status-page service) is published, with a stated uptime target and a corresponding service-credit remedy defined in the tenant Terms of Service for sustained platform-level outages — since a multi-tenant architecture means a platform outage affects every paying tenant's storefront, dashboard, and checkout simultaneously, and this needs a stated commitment rather than silence. Platform announcements ([2.5.2](#252-platform-announcements)) cross-post to this status page for planned maintenance.

### 5.18 Seasonal Capacity Planning

Agriculture is intensely seasonal — a regional pest outbreak can synchronize diagnosis and chat demand across every tenant in a region simultaneously, a pattern per-tenant rate limiting (which protects against a single bad actor, not synchronized legitimate demand) does not fully address. The diagnosis/chat pipeline is load-tested against a simulated regional-outbreak spike scenario before launch, and burst-capacity terms with Kindwise/OpenAI are negotiated or request queuing/backpressure is added as a mitigation, rather than assuming steady-state traffic patterns typical of non-agricultural SaaS.

### 5.19 Custom Domain & White-Labeling

Originally deferred as "post-MVP, indefinite" — a pricing/feature audit against comparable platforms and this vertical specifically flags this as too far deferred. Custom domains are available even at entry-to-mid tiers on Shopify/BigCommerce, and matter more for AgroSphere's B2B tenants than for typical consumer DTC: a pesticide company does not want its storefront living permanently at `syngenta.agrosphere.com` when its own B2B buyers expect `shop.syngenta.com`. This is technically low-lift given Vercel's domain API is already the hosting mechanism ([5.9](#59-hosting--dns)) — the wildcard-subdomain SSL work already solves the harder half of the problem.

- **Availability**: fast-follow priority, not MVP-blocking, but named and sequenced explicitly rather than left as an unscoped someday-item. Available at Standard and Business tiers (see [2.3.1a](#231a-feature-gating-matrix)).
- **Mechanics**: tenant adds a CNAME pointing their custom domain at AgroSphere's platform, verified and SSL-provisioned via the Vercel Domains API per-tenant (the same fallback mechanism already specified in [5.9](#59-hosting--dns) for when wildcard nameservers aren't available). `Tenant.customDomain` (already present in the schema, [0.6](#06-core-data-model)) becomes the primary resolution target in tenant-resolution middleware once verified, with the `{subdomain}.agrosphere.com` address remaining valid as a fallback.

### 5.20 Tenant API & Webhook Access (Post-MVP)

Absent from the original design entirely — no tenant-facing API or outbound webhooks (e.g. "notify my ERP when an order ships") exist anywhere in the SRS, a real gap for any tenant running their own inventory or accounting software alongside AgroSphere. This is correctly a bigger lift than the other additions in this section — it needs API key management, outbound webhook delivery with retry/backoff, and developer documentation — so it is explicitly sequenced as a **Business-tier, post-MVP roadmap item**, not promised at initial launch.

- **Scope when built**: read access to that tenant's own Product, Order, and Customer data via a versioned REST API (reusing the API-versioning policy already established for Inngest events, [5.3](#53-background-jobs--inngest)), scoped and rate-limited per tenant exactly like every other tenant-facing surface in this document.
- **Outbound webhooks**: tenant-configurable endpoints for order-status-change events, delivered with retry/backoff and a signing secret for the tenant to verify authenticity — mirroring the reliability pattern AgroSphere already uses for its own Stripe webhook consumption ([5.2.4](#524-webhook-idempotency--deduplication)).

### 5.21 Phase 2 Roadmap — Agri-Commerce Category Features

> Benchmarked against category-leading agri-commerce platforms in comparable markets (India-style agri-input distribution specifically, given the crop/pesticide/dosage focus of this product). None of the items below are MVP-blocking, but a pricing/feature audit flagged them as strategic gaps that should be named as a deliberate roadmap decision rather than left as a silent absence — a platform in this exact category that never addresses them is structurally weaker than the buyers' actual expectations.

**5.21.1 Farmer Credit / Seasonal Payment Terms**
The largest named gap. Agri-input buying is structurally seasonal — farmers frequently cannot pay until after harvest, and category leaders in this space treat credit/deferred-payment terms as a core pillar alongside input distribution, not an afterthought. Checkout ([4.3.4](#434-checkout)) is cash/card-at-purchase only via Stripe at MVP. This requires a credit-risk/underwriting partner or a BNPL vendor integration plus a collections workflow — a genuinely large lift, not appropriate for MVP — but is named here explicitly as a **Business-tier or dedicated add-on** candidate for Phase 2, since its absence is a structural disadvantage against category leaders for AgroSphere's own target buyer.

**5.21.2 WhatsApp Commerce Integration**
WhatsApp is a primary engagement channel for agri-input buyers in markets with lower-literacy or lower-digital-fluency segments (voice notes, native-language message templates). The Business-tier chatbot ([4.8](#48-ai-chatbot--rag)) is web-only at MVP. Phase 2: WhatsApp Business API integration for order status, catalog browsing, and the RAG chatbot itself, reusing the existing RAG backend as the message handler rather than building a second chat pipeline — moderate build effort, high strategic value for this buyer segment. Named as a **Business-tier add-on**, near-term fast-follow rather than full MVP.

**5.21.3 Voice Input for the Chatbot**
Section [0.8](#08-localization--currency) covers text localization and cross-lingual chatbot input, but low-literacy farmers benefit specifically from voice, not just translated text. Phase 2: speech-to-text input into the existing RAG pipeline ([4.8](#48-ai-chatbot--rag)) — a moderate-effort enhancement to an existing feature, not a new schema or architecture, so it is sequenced as a chatbot enhancement once the Business tier is live and validated.

**5.21.4 Weather Integration & Crop Calendar Advisory**
Category-leading agri-platforms commonly pair input commerce with weather-linked agronomic intelligence (e.g. seasonal reminders — "time to apply pre-emergent herbicide for your crop/region"). AgroSphere has the Dosage Calculator ([3.8](#38-dosage-calculator-configuration)) and simulated Field Mapping analysis ([4.7](#47-field-mapping)) but no weather-linked advisory or reminder engine. Phase 2: a weather API integration plus a rules-based reminder system keyed to crop + region + calendar, named as a **Business-tier fast-follow** rather than urgent for MVP.

**5.21.5 Group Buying at Cooperative Scale**
The per-product volume-pricing mechanism in [3.14.10](#31410-group--volume-pricing) covers basic tiered price breaks; a fuller cooperative/collective buying flow (shared cart across multiple farmer accounts, split payment/delivery) is a larger structural feature deferred to Phase 2 once the simpler volume-pricing mechanism validates demand.

**5.21.6 Offline / Low-Bandwidth Mode**
Not a paid feature — a platform-wide technical/performance consideration given the target market's rural connectivity profile (aggressive caching, lightweight image delivery on the storefront, offline cart persistence via browser storage). Flagged here for the engineering team as a PWA/performance priority to design toward from the start of frontend implementation, rather than a tier-gated feature to build later — retrofitting offline-friendliness onto an already-built storefront is materially harder than designing for it from the outset.

### 5.22 Demo Environment

A permanent, publicly visible demo tenant is required — not a throwaway seed script, but a real, first-class tenant that sales/marketing can link to and that always demonstrates the platform at full (Business-tier) capability. It is a real tenant in every technical sense (same `Tenant` row shape, same isolation guarantees, same route structure), distinguished only by a flag that governs a few safety behaviors described below.

**5.22.1 Demo Tenant Provisioning**
- A dedicated tenant row, `Tenant.isDemo = true`, `plan = business` (permanently — never subject to downgrade, billing dunning, or the usual plan-upgrade sales flow), subdomain `demo.agrosphere.com`.
- `isDemo` is a platform-owner-only field, not tenant-editable, and gates a small number of behaviors: outbound customer emails (order confirmations, abandoned-cart, etc.) are suppressed or redirected to a platform-controlled inbox rather than sent to whatever email a demo visitor types in; Stripe Connect runs in **test mode only** for this tenant, so no real payment ever occurs even though the full checkout UI is live and functional; the AI usage caps in [5.6](#56-rate-limiting--upstash-redis) still apply (a demo shouldn't become an unmetered way to run up OpenAI/Kindwise spend), tuned generously enough that a real visitor exploring the product never hits them under normal use.
- Everything else about the demo tenant behaves exactly like a real one — real database rows, real tenant isolation, real RLS policy, real Stripe Connect *test*-mode checkout flow end to end (a visitor can complete an entire checkout and see a real order land in the demo dashboard, using Stripe's published test card numbers).

**5.22.2 Demo Storefront**
`demo.agrosphere.com` is the current AgroSphere storefront design and copy exactly as it exists today (see [3.10.6](#3106-pre-migration-codebase-cleanup) — this is in fact the primary reason the brand-name/color-consolidation cleanup matters: the demo tenant *is* the canonical rendering of the default seed, so it must be internally consistent), fully populated with realistic seed data rather than empty states:
- A full product catalog across all categories (Insecticides, Fungicides, Organic Crop Care, Herbicides, Fertilizers), migrated from the current `data/products.ts` and expanded with a few additional entries so pagination, filtering, and search all have real content to demonstrate.
- Full case-study set (from `data/case-studies.ts`), field-officer directory with real-looking (not "Test Officer 1") profiles and plausible service-area coordinates so Nearby Help's map/geolocation flow has something to show, and a populated dosage-calculator configuration (from `data/calculator-data.ts`).
- A handful of pre-populated `DiagnosisRequest` and `ChatMessage` example rows so a visitor who doesn't want to run the AI flows themselves can still see what the diagnosis log and chat log look like from the dashboard side.
- Every optional page ([3.10.3](#3103-page-visibility-toggles)) enabled, since the demo's job is to show the full breadth of the product, not a realistic single-tenant configuration.

**5.22.3 Demo Dashboard**
A demo login (see [5.22.4](#5224-demo-credentials)) grants access to the demo tenant's own `/dashboard`, fully functional as `tenant_owner` — every module in section 3 is reachable and populated with real-looking data (the product catalog above, sample orders in various lifecycle states so [3.5.1](#351-order-lifecycle)'s status flow is visible, sample staff accounts under each scoped role so [3.1.1](#311-staff-roles) is demonstrable, a populated AI document library and chat/diagnosis logs). A visitor can edit anything in the demo dashboard exactly like a real tenant — this is a real, working environment, not a read-only mockup — with two safety exceptions: Stripe Connect stays in test mode ([5.22.1](#5221-demo-tenant-provisioning)), and outbound email is redirected, both per the provisioning rule above.
- **Reset policy.** Because the demo dashboard is genuinely editable, a scheduled Inngest job resets the demo tenant's data to its canonical seed state on a fixed daily schedule (e.g. every 24 hours, off-peak), so one visitor's experimentation doesn't degrade the next visitor's demo. This is disclosed on the demo dashboard itself ("Demo data resets daily — changes are not saved").

**5.22.4 Demo Credentials**
Published on the platform marketing site and in sales/onboarding materials, not hidden behind a request form:

| Surface | Login | Notes |
|---|---|---|
| Demo storefront | No login required to browse | `demo.agrosphere.com` — full storefront is public, checkout uses Stripe test-mode card numbers |
| Demo dashboard | `demo@agrosphere.com` / `AgroDemo2026!` | `tenant_owner` role, full access to every Business-tier module |
| Demo customer account | `farmer@agrosphere.com` / `AgroDemo2026!` | Pre-populated order history, saved wishlist, so `/profile` has real content to show |

Credentials are static and intentionally memorable rather than randomly generated per visit, since the whole point is frictionless public access; this is safe specifically because of the `isDemo` safety behaviors in [5.22.1](#5221-demo-tenant-provisioning) (no real payments, no real email delivery) and the daily reset in [5.22.3](#5223-demo-dashboard) — the demo credentials are never treated as a real security boundary, only as a convenience gate, and no sensitive/real data is ever reachable through them.

**5.22.5 Super Admin Visibility**
The demo tenant appears in `/super-admin/tenants` like any other, clearly labeled (`isDemo` badge), excluded from platform revenue/GMV analytics in [2.4.1](#241-cross-tenant-dashboard) (it generates no real revenue and would distort MRR/GMV reporting if counted), but included in AI-usage-cost tracking, since demo traffic still costs real OpenAI/Kindwise spend and should be visible as a platform cost line, not hidden.

### 5.23 API Contract Reference

> Every route in this document has a stated access-control level (who can call it), but not a stated request/response shape. This section closes that gap for the highest-traffic and most structurally complex endpoints — the ones a frontend/mobile client actually needs a real contract for, not an exhaustive listing of all ~80 routes, most of which are conventional CRUD that follows the field tables already given per module. All routes return `application/json`; all authenticated routes expect the session cookie (no separate bearer-token API at MVP, consistent with [0.2](#02-technology-stack)'s NextAuth-only auth model).

**POST `/api/checkout`** (creates a Stripe Checkout Session, [4.3.4](#434-checkout))
```
Request:
{
  "cartId": "crt_9f21a0",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",  // client-generated UUID, see 4.3.4
  "applicatorCredentialRef": "APL-2024-88213"  // required only if cart contains a requiresApplicatorCredential item
}

Response 200:
{ "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_..." }

Response 409 (stock unavailable, see 6.16):
{
  "error": "stock_unavailable",
  "items": [{ "productId": "prd_4b91c0", "requested": 5, "available": 2 }]
}

Response 400 (missing applicator credential):
{ "error": "applicator_credential_required", "productIds": ["prd_4b91c0"] }
```

**POST `/api/diagnose`** (image diagnosis, [4.9](#49-disease-diagnosis))
```
Request: multipart/form-data
  image: <file>
  disclaimerAcknowledged: true

Response 200 (above confidence floor, product match found):
{
  "diagnosisId": "dgn_991a4c",
  "detectedDisease": "Cotton Leaf Curl Virus",
  "confidence": 0.87,
  "belowConfidenceThreshold": false,
  "treatment": "...",
  "recommendedProducts": [{ "id": "prd_4b91c0", "name": "AgriShield Pro 500EC", "price": 3200.00 }]
}

Response 200 (below confidence floor — see 6.4 step 6):
{
  "diagnosisId": "dgn_991a4c",
  "detectedDisease": "Cotton Leaf Curl Virus (suspected)",
  "confidence": 0.41,
  "belowConfidenceThreshold": true,
  "treatment": "...",
  "recommendedProducts": []
}

Response 502 (Kindwise vendor failure — see 6.4 step 6):
{ "error": "diagnosis_unavailable", "retryable": true }

Response 429 (rate limit / cost cap, see 5.6):
{ "error": "rate_limited", "retryAfterSeconds": 3600 }
```

**POST `/api/chat`** (RAG chat, streaming response, [4.8](#48-ai-chatbot--rag))
```
Request:
{ "sessionId": "cst_a01b2c", "message": "What's the dose for cotton whitefly?", "disclaimerAcknowledged": true }

Response 200: text/event-stream (token-by-token, per the streaming UI requirement in 4.8/6.5), terminating with:
data: { "done": true, "sourceChunkIds": ["chk_1a", "chk_2b"], "messageId": "msg_77c1" }

Response 502 (OpenAI vendor failure — see 6.5 step 6):
data: { "error": "chat_unavailable", "retryable": true }
```

**POST `/dashboard/products`** (create product, [3.3.2](#332-create--edit-product))
```
Request:
{
  "name": "AgriShield Pro 500EC", "description": "...", "price": 3200.00, "currency": "PKR",
  "categoryId": "cat_pest_01", "images": ["<cloudinary-signed-upload-id>"], "stock": 84,
  "sku": "AGS-500EC-1L", "roleTag": "pest", "regulatoryClass": "restricted_use",
  "approvedLabelUrl": "<cloudinary-signed-upload-id>", "requiresApplicatorCredential": true
}

Response 201: { "id": "prd_4b91c0", ...same shape as the Product worked example in 0.9 }

Response 422 (validation failure — the field-level rules from 3.3.2 enforced server-side):
{
  "error": "validation_failed",
  "fields": {
    "images": "At least one image is required",
    "approvedLabelUrl": "Required for restricted_use products"
  }
}

Response 402 (storage quota exceeded, see 5.4.1):
{ "error": "storage_quota_exceeded", "usedBytes": 10737418240, "capBytes": 10737418240 }
```

**POST `/dashboard/products/import`** (bulk CSV, [3.14.1](#3141-bulk-product-import--export))
```
Request: multipart/form-data, file: <products.csv>

Response 200 (partial success, per 3.14.1's stated partial-import policy):
{
  "totalRows": 200,
  "imported": 187,
  "failed": 13,
  "resultsReportUrl": "https://res.cloudinary.com/agrosphere/bayer/imports/import-88a2-results.csv"
}
```

Every other CRUD route not detailed above (Categories, Case Studies, Field Officers, Discounts, etc.) follows the same conventions demonstrated here: request body matches the module's field table exactly, `201` on create / `200` on read-update / `204` on delete, `422` with a `fields` map on validation failure, `403` on a role/plan-gate rejection with an `{ "error": "insufficient_permission" }` or `{ "error": "plan_upgrade_required", "requiredPlan": "standard" }` body distinguishing the two distinct rejection reasons.

### 5.24 Toast & Notification Policy

> Not previously specified as a system-wide policy — the current codebase has a working `ToastContext` but no stated rule for *which* actions across this entire document should surface one, what they should say, or how they map onto the mutation states TanStack Query now manages ([0.2](#02-technology-stack)). This closes that gap with a concrete, implementable policy rather than a general "add toasts" instruction.

**5.24.1 Library & Mechanism**
**Sonner**, replacing the existing hand-rolled `ToastContext` (see [0.2](#02-technology-stack)). Every mutating action in this document (anything that creates, updates, or deletes data — not read-only navigation) is wired through TanStack Query's `useMutation`, and every such mutation uses Sonner's `toast.promise()` to drive the toast lifecycle directly from the mutation's own `pending`/`onSuccess`/`onError` states — a developer implementing any action in this document does not hand-write a `toast()` call after a manual `fetch`, the toast is a direct, automatic consequence of wiring the mutation correctly. This guarantees consistency: it is structurally difficult to forget a toast on a new action, since the pattern is "every mutation gets `toast.promise()`," not "remember to add a toast."

**5.24.2 Toast Taxonomy**

| Type | When | Duration | Example |
|---|---|---|---|
| `loading` | While a mutation's promise is pending (Sonner shows this automatically via `toast.promise()`, not a separately-triggered toast) | Until resolved | "Adding to cart..." |
| `success` | Mutation resolves successfully | 3s auto-dismiss | "Added to Protection Plan" |
| `error` | Mutation rejects — **message sourced from the API's actual error response** ([5.23](#523-api-contract-reference)'s error shapes), never a generic "Something went wrong" when a specific reason is available | 5s auto-dismiss (longer than success, since an error needs more time to read) or manual-dismiss for anything requiring action | "Only 3 left — update quantity to continue" (from a 409 stock-conflict response) |
| `info` | A non-mutation state change worth surfacing (e.g. a background job completing, a real-time flag appearing) | 4s auto-dismiss | "Your CSV import finished — 187 imported, 13 failed" |

**5.24.3 Per-Action Policy**

Every action already specified elsewhere in this document that should fire a toast, with the message and type — this is the actual "every action stays up to date for the user" requirement, made concrete rather than left as a general intention:

| Action | Toast |
|---|---|
| Add to cart ([4.3.1](#431-catalog)) | success: "Added to Protection Plan" |
| Remove from cart | info: "Removed from Protection Plan" |
| Checkout stock conflict ([6.16](#616-checkout-time-stock-unavailability)) | error, manual-dismiss: the specific per-item message from the 409 response |
| Order placed ([6.6](#66-order-lifecycle-farmer-to-fulfillment)) | success: "Order placed — confirmation sent to your email" |
| Order cancelled by farmer ([6.15](#615-farmer-initiated-order-cancellation)) | success: "Order cancelled and refunded" |
| Diagnosis submitted ([4.9](#49-disease-diagnosis)) | loading while processing, then success/error based on the Kindwise result — **not** used for the diagnosis *result itself* (below-threshold vs. matched), which renders as page content, not a toast, since it's the primary content of that screen, not a side-effect notification |
| Diagnosis vendor failure ([6.4](#64-farmer-diagnosis-to-purchase-flow) step 6) | error, manual-dismiss: "Diagnosis is temporarily unavailable — try again or talk to a Field Officer" |
| Chat message send failure ([6.5](#65-rag-chat-query) step 6) | Rendered inline in the chat widget itself, per [4.8](#48-ai-chatbot--rag)'s UI-states spec — **not** a toast, since an inline chat-thread error reads more naturally in that specific surface |
| Product created/updated ([3.3.2](#332-create--edit-product)) | success: "Product saved" / error: field-level errors render inline on the form (per React Hook Form + Zod, [0.2](#02-technology-stack)), with a summary error toast only if the submission itself failed for a non-field reason (e.g. network, [5.23](#523-api-contract-reference)'s storage-quota 402) |
| Product archived/restocked | success: "Product archived" / "Stock updated" |
| CSV import complete ([3.14.1](#3141-bulk-product-import--export)) | info, manual-dismiss with a "View Report" action button: "187 imported, 13 failed" |
| Category delete blocked ([3.4.2](#342-create--edit--delete)) | error, manual-dismiss: the specific product-count message, with a "Reassign Products" action button |
| Staff invited/removed ([3.1.2](#312-staff-invitations), [3.1.4](#314-role-change--removal)) | success: "Invitation sent" / "Staff member removed" |
| Staff invite rejected — seat cap reached ([3.1.2a](#312a-seat-cap-enforcement)) | error, manual-dismiss, with an "Upgrade Plan" action button: "Seat limit reached — upgrade to Standard or remove a staff member to invite" |
| Upload rejected — storage quota exceeded ([5.4.1](#541-storage-quota-enforcement)) | error, manual-dismiss, with an "Upgrade Plan" action button: "Storage limit reached — upgrade your plan or remove unused files" (the client-facing rendering of the `402 storage_quota_exceeded` response, [5.23](#523-api-contract-reference)) |
| Refund issued ([6.11](#611-refund-initiation)) | success: "Refund issued — $X returned to customer" |
| Discount code applied/rejected at checkout ([3.5.4](#354-discounts--coupons)) | success: "Discount applied" / error: the specific rejection reason (expired/exhausted/not found) |
| CMS section published ([3.10.2a](#3102a-preview--version-history)) | success: "Changes published to your storefront" |
| CMS section reverted to a prior version | success: "Reverted to previous version" |
| Tenant plan upgraded/downgraded ([6.9](#69-plan-upgrade--downgrade)) | success: "Upgraded to Business" / info: "Downgraded to Standard — some features are now locked" |
| MFA enabled/disabled ([5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts)) | success: "Two-factor authentication enabled" |
| Password/email changed ([4.10.1](#4101-email-change), [6.13](#613-password-reset)) | success: "Password updated" / "Verification email sent to your new address" |
| Review submitted ([3.3.3a](#333a-review-integrity)) | success: "Review submitted" / error: "You can only review products you've purchased" (if the verified-purchase gate rejects it) |
| Wishlist add/remove ([3.14.5](#3145-wishlist--saved-items)) | info (brief, low-emphasis — this is a light-touch action, not a commerce-critical one): "Saved to wishlist" |
| Bundle/volume-pricing conflict at checkout ([3.5.4](#354-discounts--coupons)) | info: "A better price was automatically applied" (when a volume break supersedes an entered discount code — a transparency notice, not an error, since the farmer still gets the better outcome) |
| Rate-limited action ([5.6](#56-rate-limiting--upstash-redis)) | error, specific to the cause per the distinct messages already specified in [4.8](#48-ai-chatbot--rag)'s UI states (tenant-wide cap vs. per-session throttle) |

**5.24.4 What Does Not Get a Toast**
Read-only navigation (viewing a list, opening a detail page) never triggers a toast — toasts are reserved for the result of an action the user took, consistent with [5.24.1](#5241-library--mechanism)'s "mutations only" scope. Content that is the primary subject of a screen (a diagnosis result, a chat response, inline form field errors) renders as page content, not a toast, even though it's triggered by a user action — the distinguishing test is whether the information is transient/supplementary (toast-appropriate) or the actual thing the user came to see (page-content-appropriate).

### 5.25 Neon Database Provisioning & Environment Strategy

> A deliberate, explicit decision on how the Neon-hosted Postgres database connects to Vercel — **manually managed environment variables, not Vercel's Neon marketplace integration/auto-connect**. This keeps the database and the hosting platform decoupled: no third-party integration owns the connection lifecycle, credentials are visible and directly editable in both places, and the database is not tied to Vercel's own account/billing relationship with Neon.

**5.25.1 Provisioning**
The Neon project is created directly in the Neon dashboard (not via Vercel's "Add Integration" marketplace flow). This yields two connection strings from Neon's Connection Details panel:
- **Pooled connection** (hostname contains `-pooler`) — Neon's built-in, PgBouncer-compatible pooler in transaction mode. Used as `DATABASE_URL`.
- **Direct connection** (no `-pooler` in the hostname) — unpooled, used only for schema migrations. Used as `DIRECT_URL`.

Both are referenced in `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```
This is the same two-variable pattern already assumed throughout this document (e.g. [0.7](#07-data-isolation-policy)'s migration policy) — Neon fulfills both roles without introducing a third connection string or a schema change.

**5.25.2 Environment Variable Placement**
`DATABASE_URL` and `DIRECT_URL` are set **identically by hand** in two separate places, not synced automatically between them:
- **Local development**: `.env.local`, matching the variable names already present from this project's earlier setup.
- **Vercel**: Project Settings → Environment Variables, added manually for each deployment environment that needs them (Production, Preview, Development) — not injected by an integration. A Preview deployment can point at the same Neon database as Production, or at a separate Neon branch (see [5.25.3](#5253-neon-branching-for-migration-testing)), depending on which environment variable set is configured for that Vercel environment.

**Consequence of this choice, stated explicitly**: rotating a Neon password or regenerating a connection string requires updating it in both places by hand — there is no single source of truth an integration would otherwise maintain. This is an accepted tradeoff for the decoupling this strategy is chosen for, not an oversight.

**5.25.3 Neon Branching for Migration Testing**
Neon's branching feature (an instant, copy-on-write clone of the database) is the concrete mechanism behind [0.7](#07-data-isolation-policy)'s requirement that "migrations are tested against a production-sized snapshot before deploy" — a Neon branch created from the production database gives a realistic-scale environment to run a new migration against, without needing a separately maintained staging database kept in sync by hand. This branch's own connection strings are used only for this pre-deploy testing step, not wired into any running environment.

**5.25.4 Vercel Deployment Independence**
Because the Neon connection is plain environment variables rather than a Vercel-managed integration, a Vercel redeploy, a Vercel project transfer, or a Vercel account change never affects the Neon database or its credentials — the two systems have no structural dependency on each other beyond the environment variables Vercel is told to inject at build/runtime, matching the "not disturb the Vercel deployment" requirement this strategy was chosen to satisfy.

---

## 6. End-to-End Flows

> **Coverage note.** A review of this section against the rest of the document found real scope gaps: flows that assumed a feature was available regardless of plan tier (contradicting the gating rules in [2.3.1a](#231a-feature-gating-matrix)), and whole categories of user journey — prospect evaluation via the demo, farmer account creation, staff invitation, plan upgrade/downgrade, platform-side tenant approval — that were fully specified as modules but never walked through end-to-end. All are added below; the original onboarding flow's unconditional diagnosis step (it showed a farmer diagnosing a crop regardless of whether the tenant's plan actually included that feature) is corrected in place in [6.2](#62-tenant-onboarding-start-to-first-sale), not just appended around.

### 6.1 Prospect Evaluation to Signup

The flow a prospective tenant actually takes through the Marketing Site ([1](#1-marketing-site)) before becoming a tenant — this did not exist as a named flow despite every page in it being fully specified as a module.

1. Prospect discovers AgroSphere (search, referral, sales outreach) and lands on `/` ([1.2](#12-home)).
2. Clicks **"See Live Demo"** (the primary CTA) → explores the public demo storefront and dashboard ([5.22](#522-demo-environment)) with zero signup friction — this is the platform's primary trust-building mechanism, and the flow is expected to route through it far more often than a cold signup.
3. Reviews `/pricing` ([1.4](#14-pricing)) and `/security` ([1.8](#18-security--trust)) to evaluate plan fit and platform trust posture.
4. Either self-serve continues to `/get-started` ([1.5](#15-signup--get-started)) with a plan pre-selected from the pricing page, **or** uses `/contact` ([1.6](#16-contact--sales)) to talk to sales first (larger prospects evaluating Business tier) — both paths converge on the same onboarding flow below.
5. Continues into [6.2](#62-tenant-onboarding-start-to-first-sale).

### 6.2 Tenant Onboarding, Start to First Sale

1. Company applies via `/get-started` on the Marketing Site ([1.5](#15-signup--get-started)) or is created manually by platform owner ([2.2.1](#221-tenant-onboarding)), including business registration number, regulatory self-declaration, and **a selected plan tier** (Startup/Standard/Business) — the plan selection carries through from the pricing page if the prospect arrived via [6.1](#61-prospect-evaluation-to-signup), or defaults to a platform-owner choice for a manually-created tenant.
2. Platform owner reviews via the flow in [6.7](#67-platform-tenant-approval-review) and approves → `tenant_owner` account created, invite email sent.
3. Owner sets password, lands on `/dashboard/setup`.
4. Owner completes Stripe Express onboarding ([5.2](#52-payments--stripe-connect-express)).
5. Owner adds first Category, first Product (with regulatory classification and approved label if restricted-use), uploads logo/brand colors (or accepts AgroSphere defaults).
6. **If plan is Standard or Business**: owner adds at least one Field Officer (with a recorded consent timestamp) — this module is locked/preview-only below Standard, per [2.3.1a](#231a-feature-gating-matrix), so a Startup-tier onboarding skips this step entirely rather than showing it as unavailable mid-flow.
7. **If plan is Business**: owner uploads a product spec sheet → RAG pipeline embeds it in the background → first document goes through the pre-publish moderation scan ([2.6.2](#262-content-moderation)) before going live, and reviews the diagnosis confidence-floor/product-mapping defaults ([3.12.2](#3122-disease--product-mapping-rules)). Startup/Standard tenants skip this step; the AI modules render as a locked preview in their dashboard instead ([2.3.1b](#231b-lockedupgrade-preview-state)).
8. Storefront at `{subdomain}.agrosphere.com` is now live and sellable, cached per [5.10](#510-caching-strategy) for fast resolution.
9. A farmer visits and browses. **If the tenant is Business tier and the chatbot/diagnosis are actually toggled on** ([3.11.6](#3116-chatbot-live-toggle)), the farmer may diagnose a crop photo (acknowledging the AI disclaimer first) and get a product recommendation if confidence clears the platform floor ([6.4](#64-farmer-diagnosis-to-purchase-flow)); **otherwise** the farmer browses the catalog directly or uses Nearby Help (Standard+) to reach a field officer. Either path converges on checkout — tax calculated via Stripe Tax, payment lands directly in the tenant's Stripe account, with the platform's reserve policy applied per the tenant's risk tier ([6.6](#66-order-lifecycle-farmer-to-fulfillment)).

### 6.3 Farmer Account Creation & Cross-Session Cart

Never previously walked through end-to-end despite [4.1](#41-authentication) and [4.3.3](#433-cart--protection-plan) both fully specifying the individual mechanics.

1. Farmer browses a tenant's storefront as a guest, adds items to cart (anonymous/client-side-keyed).
2. Farmer proceeds to `/checkout`, is redirected to `/login?redirect=/checkout` (validated per [5.1.9a](#519a-open-redirect-prevention)) since checkout requires an account.
3. Farmer either signs up (`/signup`, tenant-scoped per the `(email, tenantId)` uniqueness rule in [0.6](#06-core-data-model)) or logs into an existing account for that specific tenant.
4. On successful login/signup, the guest cart is merged into the now-authenticated customer's persisted cart ([4.1](#41-authentication), "Cart merge on login") — no items are lost.
5. Farmer is returned to `/checkout` per the redirect param, cart intact, and proceeds into [6.6](#66-order-lifecycle-farmer-to-fulfillment).
6. Once authenticated, the farmer's `/profile` ([4.10](#410-profile--order-history)) accumulates order history, wishlist ([3.14.5](#3145-wishlist--saved-items)), and saved field-mapping data across future visits to that same tenant's storefront — never carrying over to any other tenant's subdomain, per the tenant-scoped identity model.

### 6.4 Farmer Diagnosis-to-Purchase Flow

> Applies only when the visiting tenant is on the Business plan **and** has toggled the chatbot/diagnosis on ([3.11.6](#3116-chatbot-live-toggle)) — see the gating check folded into [6.2](#62-tenant-onboarding-start-to-first-sale) step 9. A Startup/Standard tenant's storefront shows the locked preview state ([2.3.1b](#231b-lockedupgrade-preview-state)) instead of this flow.

1. Farmer uploads a crop photo on the diagnosis widget, acknowledging the AI disclaimer on first use of the session. UI shows a progress/skeleton state while the Kindwise call is in flight (steps 3-4 typically take several seconds, consistent with the `maxDuration` tuning in [5.9](#59-hosting--dns)) — never a blank or frozen screen.
2. Rate limiter checks tenant + session caps, reconciled against the centralized cost-cap counter.
3. Photo uploaded to Cloudinary with signed delivery; `DiagnosisRequest` row created with `status = processing`.
4. Kindwise `crop.health` API called with the image.
5. Result parsed: disease name, confidence, treatment guidance, disease category.
6. **If the Kindwise call times out or errors** (vendor outage, rate limit, network failure): `DiagnosisRequest.status` is set to `failed` rather than left in `processing` indefinitely; the farmer sees a clear message ("Diagnosis is temporarily unavailable — try again or talk to a Field Officer") with a retry action and a direct link to Nearby Help, never a silent hang or a generic error page. This failure is tagged and surfaced through the observability pipeline in [5.11.1](#5111-error-tracking--structured-logging), distinct from a normal below-threshold result.
7. If confidence is below the platform-wide floor → show diagnosis/treatment guidance only + "Talk to a Field Officer" CTA, no product surface at all.
8. If confidence clears the floor → category matched against that tenant's Product role tags (pest/fungal/growth/weed).
9. If a match exists → show product card + "Add to Protection Plan" CTA.
10. If confidence clears the floor but no match exists → show treatment guidance + "Talk to a Field Officer" CTA, behind the same disclaimer as the recommendation path.
11. `DiagnosisRequest` saved with final result and confidence flag, visible in the tenant's diagnosis log ([3.12.1](#3121-diagnosis-log)) as the evidentiary record.

### 6.5 RAG Chat Query

> Same plan/toggle gating precondition as [6.4](#64-farmer-diagnosis-to-purchase-flow) — applies only to a Business-tier tenant with the chatbot live.

1. Farmer asks a question in the chat widget on a specific tenant's storefront, acknowledging the AI disclaimer on first use of the session.
2. Rate limiter checks tenant + session caps, reconciled against the centralized cost-cap counter.
3. Query text embedded via OpenAI embeddings.
4. pgvector similarity search restricted to `DocumentChunk WHERE tenantId = current` (raw SQL, RLS-backed as a second isolation layer), top-k retrieved.
5. Retrieved chunks + tenant's custom system prompt (with disclaimer language the tenant cannot remove) + conversation history assembled into the LLM call. Response tokens render into the chat widget **as they stream** from OpenAI, not held back until the full completion finishes — this is the actual UI requirement behind step 6's "streamed back," specified explicitly here rather than left implicit.
6. **If the OpenAI call fails or errors mid-stream** (vendor outage, rate limit): the partial response (if any tokens were already streamed) is left visible, a clear inline error ("Something went wrong — try asking again") is appended rather than the widget silently going quiet, and no `ChatMessage` row is saved for the failed attempt in a way that could be mistaken for a complete, citation-backed answer. Tagged through the same observability pipeline as the diagnosis failure path above.
7. Response streamed back with source document citation.
8. `ChatMessage` rows saved for the tenant's chat log viewer ([3.11.4](#3114-chat-log-viewer)); response independently scanned for dosage/mixing-safety anomalies against the tenant's own configured dosage data.

### 6.6 Order Lifecycle, Farmer to Fulfillment

1. Farmer checks out → CSRF-verified Stripe Checkout Session created against the tenant's Connect account, tax calculated via Stripe Tax; if a restricted-use item is in the cart, an applicator credential reference is captured first. If a discount code is applied (Standard+, [3.5.4](#354-discounts--coupons)) or a group/volume price break is reached (Standard+, [3.14.10](#31410-group--volume-pricing)), the adjusted total is reflected before payment.
2. Payment succeeds → Stripe webhook (deduplicated against `StripeWebhookEvent`) → Inngest job → `Order.status = payment_confirmed` → confirmation email (Resend), including the downloadable invoice/tax PDF ([3.14.3](#3143-invoice--tax-document-generation)).
3. Tenant staff view the order in `/dashboard/orders`, update status through `processing → shipped → delivered`.
4. Each status change triggers a customer email.
5. If a dispute is later filed, `Order.status` moves to `disputed` automatically on the Stripe webhook, with the response deadline surfaced in the tenant's Finance dashboard.
6. Order appears in the farmer's `/profile` order history (with reorder and invoice-download actions, [3.14.6](#3146-bulk-reorder)) and in the tenant's finance reporting ([3.5.3](#353-finance--revenue)).
7. **If the cart was abandoned before completing checkout** (Standard+ tenants), a scheduled reminder email fires per [3.14.7](#3147-abandoned-cart-recovery) instead of this flow proceeding past step 1 — a parallel, not sequential, path.

### 6.7 Platform Tenant Approval Review

The platform-owner-side counterpart to [6.2](#62-tenant-onboarding-start-to-first-sale) step 2 — previously compressed into a single line despite [2.2.1](#221-tenant-onboarding) specifying a real multi-part review.

1. Application appears in `/super-admin/tenants` with `status = pending`.
2. Platform owner (or `platform_staff`) performs the trademark/legitimacy check, verifies the submitted business registration number, and reviews the regulatory self-declaration.
3. **If the applicant declared restricted-use pesticide sales**: `regulatoryReviewStatus = pending` is set and the separate compliance review in [5.14.3](#5143-tenant-onboarding-regulatory-review) must clear before those specific product categories can be activated — general commerce approval is not blocked on this.
4. Owner approves or rejects. On approval, `Tenant.status = active`, continuing into [6.2](#62-tenant-onboarding-start-to-first-sale) step 2's continuation (account creation, invite email).
5. On rejection, the applicant is notified via Resend with a reason; no `Tenant` row transitions to `active` and no further onboarding steps are reachable.

### 6.8 Staff Invitation to Scoped Access

Fully specified as a module ([3.1.2](#312-staff-invitations), [3.1.4](#314-role-change--removal)) but never shown as a flow.

1. `tenant_owner`/`tenant_admin` invites a new staff member by email, assigning one or more scoped roles ([3.1.1](#311-staff-roles)).
2. Invite email sent via Resend, 72h expiry, single-use.
3. Invitee accepts, sets a password via NextAuth credentials — account is created scoped to that tenant's `(email, tenantId)` pair.
4. On first login, the dashboard nav shows the **union** of all modules the invitee's assigned roles grant access to, and nothing else ([3.1.1](#311-staff-roles)) — e.g. an `order_manager` sees Orders and Discounts only, never Products or Finance.
5. **If the owner later changes or revokes that staff member's roles**: `User.sessionVersion` increments, invalidating their active session on the very next request ([5.1.6](#516-session-freshness--revocation-policy)) — they cannot continue acting under old permissions for any window of time, and the change is written to the tenant's own audit log ([3.14.11](#31411-tenant-visible-staff-audit-log)).

### 6.9 Plan Upgrade / Downgrade

Never walked through despite [2.3.1](#231-plan-tiers) specifying detailed module-disable/reactivate behavior on downgrade.

1. Tenant owner visits `/dashboard/billing`, selects a new plan tier.
2. **Upgrade** (e.g. Standard → Business): takes effect immediately — the AI modules ([3.11](#311-ai--rag-knowledge-base), [3.12](#312-image-diagnosis-settings)) and advanced analytics ([3.13.1](#3131-advanced-analytics)) unlock in the dashboard nav on the tenant's very next request (via the same cached-but-actively-invalidated plan lookup used for suspension, [5.10.1](#5101-tenant-resolution-cache)); any previously-uploaded documents or chat/diagnosis history from an earlier Business-tier period (if the tenant had downgraded before) reactivate automatically rather than requiring re-upload.
3. **Downgrade** (e.g. Business → Standard) while a gated module is actively in use: a confirmation warning is shown before the change is confirmed ("Your chatbot will be disabled — your documents and chat history are kept, not deleted"). On confirmation: gated modules revert to the locked/preview state ([2.3.1b](#231b-lockedupgrade-preview-state)); any AI request already in flight at the moment of downgrade is allowed to complete, but no new request is accepted afterward, surfaced to the customer-facing UI as a clear message rather than a raw error ([2.3.1](#231-plan-tiers)).
4. The take-rate on payment processing ([2.3.1c](#231c-take-rate-on-payment-processing)) is unaffected by plan tier — it applies uniformly regardless of Startup/Standard/Business.

### 6.10 Tenant Suspension, In-Flight Order Protection

1. A tenant is suspended (billing failure, policy violation) → `Tenant.status = suspended`, cache invalidated immediately per [5.10.1](#5101-tenant-resolution-cache).
2. The storefront and most dashboard routes show a maintenance notice; `/dashboard/login` and `/dashboard/billing` remain reachable so the owner can authenticate and resolve the underlying issue.
3. Orders already `processing`/`shipped` at the moment of suspension remain viewable (read-only fulfillment exception) so tenant staff can still mark them `delivered` — a farmer's already-paid order is never stranded by a billing dispute between the tenant and the platform.
4. No new orders are accepted while suspended.
5. On reactivation, cache is invalidated again and full dashboard access is restored immediately.

### 6.11 Refund Initiation

Named as a module in [3.5.3](#353-finance--revenue) and [5.2.2](#522-dispute-chargeback--reserve-policy) covers a dispute arriving *via* Stripe webhook, but neither previously walked through a tenant actually *initiating* a refund — a routine commerce operation distinct from a dispute.

1. Tenant staff (owner, admin, or `finance_manager` on Standard+) opens an order in `/dashboard/finance` or `/dashboard/orders/[id]` and selects "Issue Refund" — full or partial amount.
2. Refund request calls the Stripe Refund API against the tenant's own Connect account (not the platform account) — the platform never touches the funds, consistent with the destination-charge model in [5.2](#52-payments--stripe-connect-express), with `refund_application_fee: true` set by default so the platform's own 0.5% take-rate fee on this order is reversed proportionally alongside the tenant's refund — see [5.2.6](#526-take-rate-collection-mechanism) for the full mechanism this closes.
3. Stripe processes the refund; a `charge.refunded` webhook confirms it (deduplicated against `StripeWebhookEvent`, [5.2.4](#524-webhook-idempotency--deduplication)).
4. `Order.status` moves to `refunded` (full refund) or gains a partial-refund annotation on the order record (partial) — distinct states, since a partially-refunded order is still otherwise fulfilled and should not read as fully reversed in the tenant's finance reporting.
5. Farmer is notified via Resend; the invoice/tax PDF ([3.14.3](#3143-invoice--tax-document-generation)) is regenerated to reflect the refunded amount.
6. The refund is written to the tenant's own audit log ([3.14.11](#31411-tenant-visible-staff-audit-log)), since refund authority is a sensitive action worth tracking per staff member.

### 6.12 Content Moderation Escalation

Names the resolution path for what [2.6.2](#262-content-moderation) specifies as mechanics only (`pending_review`, auto-approve, flagged → human queue, real-time chat-output anomaly detection) — this is the platform's actual kill-switch for bad AI advice on a regulated product category, so leaving it undescribed as a flow was a real gap, not a cosmetic one.

**Document-level (pre-publish):**
1. A newly-uploaded tenant document completes embedding and the automated safety scan flags it (`TenantDocument.status = pending_review` stays blocked rather than advancing to `ready`).
2. It appears in `/super-admin/moderation`; platform staff are notified.
3. **While pending**: the document is excluded from RAG retrieval entirely — [4.8](#48-ai-chatbot--rag) (the storefront chatbot experience) never cites it, and it is dropped from the retrieval set used by [3.11.2](#3112-embedding-pipeline-background)'s pipeline output — the chatbot is not degraded or paused platform-wide, it simply operates without that one document's content until resolved.
4. Platform staff reviews and either **approves** (`status → ready`, document becomes retrievable) or **rejects** (`status` stays blocked, tenant is notified via Resend with the reason, and can re-upload a corrected version — which re-enters the same review queue as a new document).

**Real-time chat-output anomaly (post-response):**
1. A live chatbot response is flagged by the same safety classifier (off-label mixing suggestion, dosage contradicting the tenant's own configured data) — this check runs *after* the response has already streamed to the farmer, since it is not on the synchronous request path.
2. The flag does **not** retroactively unsend or edit the message the farmer already saw — that is not technically possible for a completed chat response — but it does alert platform staff immediately and surfaces in the tenant's chat log viewer ([3.11.4](#3114-chat-log-viewer)) as a flagged entry.
3. Platform staff investigates the source document driving the flagged answer and can disable that specific document (same effect as step 3 above) to prevent recurrence, without waiting for or requiring a full re-review of the tenant's entire document library.

### 6.13 Password Reset

Mechanics were fully specified in [5.1.9](#519-password-reset-flow) but — unlike staff invitation ([6.8](#68-staff-invitation-to-scoped-access)) and plan upgrade/downgrade ([6.9](#69-plan-upgrade--downgrade)) — never given the same narrative walkthrough treatment.

1. Farmer or staff member requests a reset from their tenant's `/login` page (or `/super-admin/login` for platform roles).
2. Request is scoped to the `(email, tenantId-from-current-subdomain)` tuple — a reset requested on one tenant's subdomain can never target a same-email account on a different tenant ([5.1.9](#519-password-reset-flow)).
3. Single-use, 1-hour-expiring token emailed via Resend.
4. User clicks the link, sets a new password.
5. `User.sessionVersion` increments, immediately invalidating every other active session for that account — closing the window where a stolen-then-reset account could otherwise still have the attacker's prior session valid.
6. Redirected to login with the new password.

### 6.14 Demo Environment Reset

Names the mechanism already specified in [5.22.3](#5223-demo-dashboard) as a flow, consistent with how thoroughly every other module in this document is walked through end-to-end — relevant because [6.1](#61-prospect-evaluation-to-signup) routes most prospects through the demo as the platform's primary trust-building mechanism, so what a visitor actually experiences matters.

1. A visitor logs into the public demo dashboard ([5.22.4](#5224-demo-credentials)) and edits data — adds a product, changes an order status, uploads a document.
2. Their changes are genuinely persisted and visible for the remainder of that day, exactly like a real tenant's dashboard — this is deliberate, not a bug, since a read-only mockup would undersell the product.
3. A scheduled Inngest job runs off-peak on a fixed 24-hour cycle, resetting the demo tenant's data to its canonical versioned seed state ([2.5.3](#253-default-content-seeds)).
4. The next visitor within that 24-hour window sees whatever the prior visitor left behind; the visitor after the reset sees a clean canonical demo again. This is disclosed directly on the demo dashboard ("Demo data resets daily — changes are not saved") so no visitor mistakes their edits for persistent.

### 6.15 Farmer-Initiated Order Cancellation

Named as a distinct flow per [3.5.1b](#351b-farmer-initiated-cancellation), previously entirely absent from the document.

1. Farmer views a `pending` or `payment_confirmed` (not yet `processing`) order in `/profile`.
2. A "Cancel Order" action is available — clearly explained as only available at this stage, with the tenant's support channel ([3.9.1](#391-farmer-facing-support-channel)) surfaced as the path forward if the order has already moved to `processing` or beyond.
3. On confirmation: Stripe refund issued (full amount, `refund_application_fee: true` per [5.2.6](#526-take-rate-collection-mechanism)) → stock restored via the same atomic mechanism as any cancellation ([3.3.1a](#331a-stock-decrement--concurrency-control)) → `Order.status = cancelled`, `cancelledBy = customer` ([0.6](#06-core-data-model)).
4. Tenant staff are notified (dashboard + email) of the customer-initiated cancellation, distinct from a staff-initiated refund notification, so the tenant's finance reporting ([3.5.3](#353-finance--revenue)) and audit log ([3.14.11](#31411-tenant-visible-staff-audit-log)) can distinguish who initiated it.

### 6.16 Checkout-Time Stock Unavailability

Named as a distinct flow per [3.3.1a](#331a-stock-decrement--concurrency-control)/[4.3.4](#434-checkout), closing a gap where the multi-item-cart-with-partial-stock-out scenario was entirely unaddressed.

1. Farmer proceeds to checkout with a multi-item cart.
2. Server re-validates current `stock` for every line item against requested quantity, immediately before creating the Stripe Checkout Session — not assumed from the cart's last-known state.
3. **If every item has sufficient stock**: checkout proceeds normally into [6.6](#66-order-lifecycle-farmer-to-fulfillment).
4. **If one or more items are insufficient**: checkout is blocked for those specific items only — the farmer sees a clear per-item message ("Only 3 left — update quantity to continue") and can adjust quantity or remove the affected item(s); the rest of the cart remains intact and the farmer can retry checkout immediately after adjusting.
5. **The rarer race** — stock was sufficient at this re-validation but is exhausted by a concurrent buyer before payment actually confirms — is caught by the atomic `stockVersion`-guarded decrement at `payment_confirmed` ([3.3.1a](#331a-stock-decrement--concurrency-control)): if the conditional `UPDATE` affects zero rows at that point, `Order.status = payment_confirmed_oversold` rather than silently proceeding. This state is **staff-visible in `/dashboard/orders`** with a "stock conflict — resolve before fulfillment" flag, and the farmer is notified their payment succeeded but the item requires the tenant's attention (a manual refund-or-substitute decision by staff) — an honest, visible state rather than a silently oversold order shipped against negative stock.

---

## 7. Appendix

### 7.1 Explicitly Out of Scope (MVP)

- Renameable core route slugs — fast-follow, mechanics defined in [5.1.8](#518-fast-follow-renameable-route-slugs).
- Self-service field-officer login/dashboard — officers remain staff-managed directory entries at MVP.
- Real satellite/NDVI data for Field Mapping — remains simulated, as in the current build; only server-side persistence of drawn boundaries is added.
- Marketplace / cross-tenant product discovery — explicitly rejected in favor of fully isolated storefronts.
- Full drag-and-drop page builder — explicitly rejected in favor of structured CMS forms over fixed coded components.
- Full in-dashboard farmer messaging tool — a minimal support-email surface is MVP-required ([3.9.1](#391-farmer-facing-support-channel)); a full ticketing/messaging UI is a fast-follow.
- `DocumentChunk` partitioning by `tenantId` — deferred until the platform crosses roughly 50 active Business-plan tenants; the composite-index + tuned-search-depth approach is sufficient below that scale (see [0.7](#07-data-isolation-policy)).
- Custom domain / white-labeling — fast-follow (sequenced sooner than the original "indefinite post-MVP"), mechanics defined in [5.19](#519-custom-domain--white-labeling).
- Tenant-facing API/webhook access — post-MVP, Business-tier, defined in [5.20](#520-tenant-api--webhook-access-post-mvp).
- Farmer credit/BNPL, WhatsApp commerce, voice chatbot input, weather/crop-calendar advisory, cooperative group buying — named Phase 2 roadmap items, not MVP-blocking, see [5.21](#521-phase-2-roadmap--agri-commerce-category-features).
- Cooperative/multi-account shared-cart group buying (beyond simple per-product volume pricing) — deferred to Phase 2 per [5.21.5](#5215-group-buying-at-cooperative-scale).

### 7.2 Key Decisions Log

| Decision | Chosen |
|---|---|
| Client-side state management | TanStack Query for all server-state (products, orders, chat, diagnosis, dashboards); React Context retained for simple global UI state; Zustand added only for the signup wizard and Field Mapping's draw state, not as a default — see [0.2](#02-technology-stack) |
| Forms & validation | React Hook Form + Zod, with Zod schemas shared between client-side form validation and API route handlers so the two can never drift — see [0.2](#02-technology-stack) |
| Toast notifications | Sonner (already installed, previously unused) replaces the current hand-rolled `ToastContext`; every mutation wired through TanStack Query's `useMutation` + Sonner's `toast.promise()` so a toast is a structural consequence of the mutation, not a separately-remembered call; a full per-action policy (message, type, duration) specified for every mutating action in the document — see [5.24](#524-toast--notification-policy) |
| Database provider | Neon (managed Postgres), provisioned directly via the Neon dashboard, **not** Vercel's Neon marketplace integration — pooled connection as `DATABASE_URL`, direct connection as `DIRECT_URL`, both set manually in `.env.local` and in Vercel's environment variables, keeping the database and hosting platform structurally decoupled — see [5.25](#525-neon-database-provisioning--environment-strategy) |
| Localization library | next-intl, chosen over next-i18next (doesn't fit App Router) and Paraglide (too small an ecosystem) — see [0.2](#02-technology-stack) |
| Security headers | Next.js's native nonce-based CSP, generated in the existing `middleware.ts` — the framework's own maintained pattern, not a third-party package (`next-safe` rejected as less stable); defense-in-depth against XSS in tenant/farmer-rendered content (CMS text, reviews, chatbot output) — see [0.2](#02-technology-stack) |
| Testing (E2E) | Playwright, chosen for coverage of the order state machine, checkout stock-conflict handling, and cross-tenant RLS isolation via its multi-context support — unit/integration framework left open for implementation time — see [0.2](#02-technology-stack) |
| Folder structure | Full production folder structure specified across two axes (by interface: Marketing/Super Admin/Dashboard/Storefront; by layer: route, UI component, business logic, data access) with explicit rules preventing false sharing or duplicated components — the existing codebase becomes the Storefront interface only, mapped file-by-file rather than rewritten — see [0.3a](#03a-full-project-folder-structure)–[0.3c](#03c-mapping-the-existing-codebase) |
| Navigation & chrome | Exactly one nav component and one footer/chrome component per interface, rendered once in that interface's root `layout.tsx`, never rebuilt or re-imported per page — page-specific nav variants are a prop on the shared component, not a second component — see [0.3d](#03d-layout-level-navigation--chrome--one-instance-per-interface-never-per-page) |
| shadcn-first UI policy | Every interactive element across all four interfaces is a shadcn/ui component, a shadcn component with additive custom CSS, or a composition of shadcn/Radix primitives, in that strict precedence order — hand-rolled equivalents of existing shadcn components are a policy defect, not a style choice; a required reuse checklist (ui/ → shared/ → other-interface promotion candidate → new component) runs before any new component is built — see [0.3e](#03e-component-reuse--shadcn-first-policy) |
| Marketing Site | Added as a fourth first-class system (Home, Features, Pricing, Signup, Contact, About, Security/Trust, legal pages), the only route tree with zero tenant context — closes the gap where the platform's own customer-acquisition surface (root domain) was previously undefined, see [1](#1-marketing-site) |
| Marketing Site design direction | Light theme, related to but not a clone of the tenant storefront's brand identity — lightly B2B-SaaS in tone without going fully generic-corporate, see [1.1](#11-purpose--design-direction) |
| Marketing Site page scope | Features and Security/Trust pages added at MVP (conversion/trust-critical); Customer Case Studies, Blog, and Comparison pages named explicitly as fast-follow since they depend on content that can't exist at launch, see [1.12](#112-fast-follow-content--conversion-pages) |
| MFA | TOTP-based, mandatory for platform_owner/platform_staff, strongly enforced for tenant_owner before billing/staff-removal actions — see [5.1.6a](#516a-multi-factor-authentication-for-privileged-accounts) |
| Email verification | Real enforced gate (not just a dormant schema field), soft-blocks rather than hard-blocks checkout — see [4.1](#41-authentication) |
| Farmer GDPR erasure | Self-service account deletion distinct from tenant-deletion-triggers-export; anonymizes PII, retains transaction records under legitimate business basis — see [4.10.2](#4102-self-service-account-deletion-gdpr-erasure) |
| Payment idempotency | Client-generated `Idempotency-Key` on Checkout Session creation, layered under (not replacing) webhook-level dedup — see [4.3.4](#434-checkout) |
| Product deletion | Soft-delete/archive when order history exists (OrderItem snapshot integrity preserved), hard-delete only when no orders reference it — see [3.3.1](#331-product-list) |
| Inngest retry semantics | Idempotent step-level resume via Inngest memoization, not reprocess-from-scratch — prevents re-billing AI vendors on transient failures, see [3.11.2](#3112-embedding-pipeline-background) |
| AI failure UX | Explicit error/fallback branches for Kindwise/OpenAI outages in both AI flows, plus stated loading/streaming UI requirements — see [6.4](#64-farmer-diagnosis-to-purchase-flow), [6.5](#65-rag-chat-query) |
| New end-to-end flows | Refund initiation, content moderation escalation, password reset, demo environment reset — previously specified only as module mechanics, never walked through — see [6.11](#611-refund-initiation)–[6.14](#614-demo-environment-reset) |
| Plan tiers | Startup $25/mo, Standard $50/mo, Business $100/mo — feature-gated per [2.3.1a](#231a-feature-gating-matrix); revised after a pricing audit to un-gate basic finance visibility to Startup and move Field Officers/Nearby Help down to Standard |
| Pricing model | Flat monthly fee **plus** a 0.5% blended take-rate on payment processing volume — not flat-fee-only, see [2.3.1c](#231c-take-rate-on-payment-processing) |
| Staff seats / storage caps | Explicitly tiered (2/5/unlimited seats, 2/10/50 GB) — previously undefined, a cost-exposure and missed-upgrade-lever gap |
| Bulk/commerce utilities | Bulk CSV import/export, invoice PDF, low-stock alerts, wishlist, bulk reorder at every tier; abandoned cart, back-in-stock, bundles, group pricing, tenant audit log at Standard+ — see [3.14](#314-bulk-operations--commerce-utilities) |
| Advanced analytics | Cohort/LTV/funnel reporting, Business-tier only, see [3.13.1](#3131-advanced-analytics) |
| Custom domain, tenant API | Named and sequenced as fast-follow / Business-tier post-MVP rather than left indefinitely deferred, see [5.19](#519-custom-domain--white-labeling)–[5.20](#520-tenant-api--webhook-access-post-mvp) |
| Agri-commerce strategic gaps | Farmer credit, WhatsApp commerce, voice input, weather advisory, group buying named explicitly as Phase 2 roadmap, see [5.21](#521-phase-2-roadmap--agri-commerce-category-features) |
| Field officer multi-tenancy | Shared `Officer` identity + per-tenant `OfficerTenantListing` (not a plain tenant-owned table) — one real officer can be listed by multiple tenants without duplicated/drifting profiles; the only intentional exception to "every table is tenant-scoped," see [0.7](#07-data-isolation-policy) and [3.6](#36-field-officers--agents-management) |
| Nearby Help discovery isolation | Strictly tenant-scoped, no cross-tenant fallback even when a tenant has zero/few officers nearby — consistent with the no-shared-marketplace decision; empty state instead, see [4.6](#46-nearby-help--agents) |
| Pre-migration cleanup | Brand-name inconsistency ("AgriVision" vs "AgroSphere"), scattered non-centralized theme colors, and a hardcoded chatbot system-prompt string in the current codebase are required fixes before the CMS/theming module is built, not discovered after — see [3.10.6](#3106-pre-migration-codebase-cleanup) |
| Demo environment | Permanent public demo tenant (`isDemo = true`, real dashboard + storefront, test-mode Stripe, daily reset, published static credentials), not a throwaway seed script — see [5.22](#522-demo-environment) |
| Locked module UX | Visible with blurred/upgrade-prompt preview, not hidden entirely |
| Chatbot toggle | Business plan only; tenant-side on/off switch, independent of plan gating |
| Staff roles | Named, scoped roles (order/finance/product/content manager), multi-role-capable via `User.roles[]` |
| Tenancy | True multi-tenant SaaS, subdomain-per-tenant, subdomains never reissued |
| Storefront model | Isolated per tenant, not shared marketplace |
| Backend | All-in-one Next.js, no separate service |
| Theming depth | Full content/design-token editing, no drag-and-drop builder |
| Route renaming | Fast-follow, not MVP |
| Default theme | Current AgroSphere design, versioned seed, for every new tenant |
| Text AI | RAG over tenant-uploaded documents (pgvector, HNSW, RLS-backed) |
| Image diagnosis | Kindwise crop.health — single path, MVP and production, confidence-floor gated |
| Data isolation | Two layers: app-level scoping + Postgres RLS, never one alone |
| Session strategy | Database sessions, not pure JWT, for immediate revocation |
| Cookie scoping | Host-only, never a shared wildcard domain |
| Payments | Stripe Connect Express, destination charges, explicit reserve/dispute policy |
| Tax | Stripe Tax at checkout, remittance responsibility contractually assigned to tenant |
| AI liability | Mandatory disclaimer + consent + confidence floor, tenant-assigned liability in ToS |
| Regulatory | Product-level regulatory classification + license capture for restricted-use items |
| Content moderation | Pre-publish automated scan for first-time tenant documents, real-time output anomaly detection |
| Data ownership | Automatic farmer data export on tenant deletion, formal DPA between platform and tenant |
| Localization | MVP requirement (language + multi-currency), not fast-follow |
| Observability | Sentry + structured logging + status page, launch requirement |
| Backup/DR | Postgres PITR + independent logical backups, launch requirement |
| Auth | NextAuth, database sessions, host-only cookies, distinct platform/tenant cookie namespaces |
| Storage | Cloudinary, signed delivery for private tenant/farmer assets |
| Hosting | Vercel, platform-managed nameservers for wildcard SSL |
| Background jobs | Inngest, versioned event payloads, batched embedding steps |
| Email | Resend (sandbox dev / verified domain prod) |
| Rate limiting | Upstash Redis, sliding window at edge + server-reconciled hard cost caps |
| Caching | Redis for tenant resolution, Next.js `revalidateTag` for CMS content |
| Per-tenant secrets | Encrypted DB storage, not OS env vars |

### 7.3 Reference Sources

- Existing codebase: `D:\WEB DEV\AgroSphere FYP\agroSphere` — `app/`, `context/`, `lib/`, `data/`, `AppGuideline.md`, `styleGuideline.md`
- Kindwise crop.health — [kindwise.com/crop-health](https://www.kindwise.com/crop-health), docs at [crop.kindwise.com/docs](https://crop.kindwise.com/docs)
- Upstash rate limiting pattern — [upstash.com/blog/nextjs-ratelimiting](https://upstash.com/blog/nextjs-ratelimiting), [upstash.com/blog/edge-rate-limiting](https://upstash.com/blog/edge-rate-limiting)
- Resend sandbox behavior — [resend.com](https://resend.com/)
- Postgres RLS with Prisma — [nileshblog.tech/postgres-rls-prisma](https://nileshblog.tech/postgres-rls-prisma/)
- pgvector index selection (HNSW vs IVFFlat) — [bigdataboutique.com/blog/hnsw-vs-ivfflat](https://bigdataboutique.com/blog/hnsw-vs-ivfflat-how-to-choose-the-right-vector-index), [paradedb.com/learn/postgresql/pgvector-limitations](https://www.paradedb.com/learn/postgresql/pgvector-limitations)
- Prisma + `Unsupported("vector")` migration drift — [github.com/prisma/prisma/issues/26546](https://github.com/prisma/prisma/issues/26546), [github.com/prisma/prisma/issues/28867](https://github.com/prisma/prisma/issues/28867)
- Vercel wildcard subdomain SSL — [vercel.com/docs/domains/working-with-ssl](https://vercel.com/docs/domains/working-with-ssl), [vercel.com/docs/platforms/multi-tenant-platforms/concepts](https://vercel.com/docs/platforms/multi-tenant-platforms/concepts)
- Next.js middleware bypass, CVE-2025-29927 — [github.com/advisories/GHSA-f82v-jwr5-mffw](https://github.com/advisories/GHSA-f82v-jwr5-mffw), [vercel.com/blog/postmortem-on-next-js-middleware-bypass](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass)
- NextAuth wildcard-subdomain cookie scoping — [github.com/nextauthjs/next-auth/issues/6881](https://github.com/nextauthjs/next-auth/issues/6881), [github.com/nextauthjs/next-auth/issues/8222](https://github.com/nextauthjs/next-auth/issues/8222)
- Stripe Connect disputes and liability — [docs.stripe.com/connect/disputes](https://docs.stripe.com/connect/disputes), [docs.stripe.com/connect/risk-management](https://docs.stripe.com/connect/risk-management)
- Stripe webhook idempotency — [theroadtoenterprise.com/blog/stripe-webhook-idempotency-production](https://theroadtoenterprise.com/blog/stripe-webhook-idempotency-production)
- EPA pesticide e-commerce compliance — [epa.gov/compliance/fact-sheet-pesticides-sales-e-commerce](https://www.epa.gov/compliance/fact-sheet-pesticides-sales-e-commerce)
- Marketplace facilitator tax laws — [taxjar.com/sales-tax/marketplace-facilitator-laws](https://www.taxjar.com/sales-tax/marketplace-facilitator-laws)
- GDPR data portability (Article 20) — [secureprivacy.ai/blog/gdpr-right-to-data-portability](https://secureprivacy.ai/blog/gdpr-right-to-data-portability-article-20-what-it-requires-and-how-to-implement-)
- Plantix / agri-AI disclaimer precedent — [sti-portal.fao.org/info-resources/1583](https://sti-portal.fao.org/info-resources/1583)
- Shopify / BigCommerce pricing tier benchmarking — [datafeedwatch.com](https://www.datafeedwatch.com), [swell.is](https://www.swell.is), [wizcommerce.com](https://www.wizcommerce.com), [commerce-ui.com](https://www.commerce-ui.com)
- SaaS flat-fee vs. revenue-share pricing models — [getmonetizely.com](https://www.getmonetizely.com)
- India agri-commerce category leaders (DeHaat, AgroStar, Ninjacart, Gramophone) — [decentro.tech](https://www.decentro.tech), [inc42.com](https://inc42.com), [growthjockey.com](https://www.growthjockey.com)
- WhatsApp commerce in agri-input markets — [getclickmedia.com](https://www.getclickmedia.com), [watease.com](https://www.watease.com)
- B2B tiered/volume pricing patterns — [sparklayer.io](https://sparklayer.io), [virtocommerce.com](https://www.virtocommerce.com)
