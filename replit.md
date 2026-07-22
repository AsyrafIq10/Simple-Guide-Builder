# GBJ Solar Digital Asset Management System

A modular web application for managing solar PV assets throughout their lifecycle. Phase 1 covers Asset Registry, Maintenance Management, Customer Portal, and Housing Developer Solar Portfolio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/solar-dams run dev` — run the frontend (port 20874, served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Tanstack Query, Wouter routing, Recharts, Lucide icons
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (customers, sites, assets, equipment, work_orders, developer_projects, housing_units)
- `artifacts/api-server/src/routes/` — Express route handlers (dashboard, customers, sites, assets, equipment, work_orders, developer_projects, housing_units)
- `artifacts/solar-dams/src/` — React frontend (pages, components, hooks)
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Auto-generated Zod schemas (do not edit)

## Architecture decisions

- Phase 1 MVP scope: Asset Registry (M1), Maintenance Management (M5), Customer Portal (M9), Housing Developer Portfolio (M10)
- OpenAPI-first: all API contracts in `openapi.yaml`, Orval generates both React Query hooks and Zod validation schemas
- Multi-tenant SaaS design with roles: super_admin, tenant_admin, asset_manager, engineer, o_and_m_manager, technician, finance_manager, developer_project_manager, customer, auditor (auth not yet implemented in Phase 1)
- Work orders auto-generate a unique `WO-XXXXXX` number on creation
- Numeric DB fields (decimal/numeric) stored as string in Postgres and converted to number in API DTOs
- Demo Mode banner shown in Phase 1 — no authentication implemented yet

## Product

### Modules (Phase 1)
1. **Asset Registry** — Register customers, sites, PV assets, equipment with serial numbers, warranty dates, and status tracking
2. **Maintenance Management** — Create and manage work orders (preventive, corrective, emergency, inspection, warranty) with 11-state lifecycle
3. **Customer Portal** — Customer-facing views of owned assets, generation, alerts, and service history (via Customer section)
4. **Housing Developer Solar Portfolio** — Track installation progress, NEM approval workflow, handover, and warranty for each housing unit across development projects

### Dashboard KPIs
- Total PV assets, installed capacity (kWp), total sites, total customers
- Open and overdue work orders
- Asset status breakdown (operational/fault/offline/under maintenance/decommissioned)
- Warranties expiring within 90 days
- Recent work orders feed

## User preferences

_Populate as you build._

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before running API server typecheck — stale declarations cause TS2305 errors
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` — codegen also runs `typecheck:libs`
- Numeric/decimal Drizzle columns return strings from Postgres — always convert with `Number()` in DTO mapping before responding
- Do not use `console.log` in server code — use `req.log` in handlers or `logger` singleton

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- MVP phase plan in `attached_assets/GBJ_Solar_Digital_Asset_Management_System_Spec_1784711215440.json`
