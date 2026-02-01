# AFL Klant Portaal - Warehouse Safety Portal

Multi-tenant warehouse safety compliance portal with AI chatbot for Logistiekconcurrent.nl customers. Built around a tabbed QuickScan hub with 3x2 matrix (Layer x Perspective), RAG scoring, priority matrix, action tracking, document management, consultant-initiated evaluations, product recommendations, and benchmarking.

## Project Structure

```
src/
├── app/                        # Next.js 16 App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth v5 routes
│   │   ├── chat/               # Chat API (streaming)
│   │   ├── trpc/[trpc]/        # tRPC endpoint
│   │   └── upload/             # File upload (Vercel Blob)
│   ├── (auth)/                 # Auth pages (login)
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── quick-scan/         # QuickScan hub (tabbed: dashboard, samenvatting,
│   │   │   └── layer/[layer]/  #   bevindingen, prioriteiten, routekaart, acties)
│   │   ├── actions/            # Redirects → /quick-scan?tab=acties
│   │   │   ├── [actionId]/     # Action detail (back → /quick-scan?tab=acties)
│   │   │   └── new/            # Create action (back → /quick-scan?tab=acties)
│   │   ├── documents/          # Document hub (categories, versions)
│   │   ├── self-assessment/    # Consultant-initiated evaluation (read-only start)
│   │   ├── products/           # Product catalog + recommendations
│   │   ├── benchmark/          # Cross-org benchmarking
│   │   ├── admin/              # Admin (scans, products, quotes, evaluations)
│   │   │   └── evaluations/    # Create/manage evaluations per org
│   │   ├── chat/               # AI chat interface
│   │   └── settings/           # User settings
│   └── assessment/             # Public assessment (lead gen, no auth)
├── components/                 # React components, grouped by feature
│   ├── ui/                     # shadcn/ui base components
│   ├── quickscan/              # QuickScan hub, tabs, matrix, priority matrix, findings
│   ├── actions/                # Action board, cards, filters, stats
│   ├── documents/              # Document list, upload, expiry alerts
│   ├── assessment/             # Wizard, question card, result, lead form
│   ├── products/               # Product grid, cards, recommendations, quotes
│   ├── benchmark/              # Comparison, distribution, not-available
│   ├── chat/                   # Chat interface, messages, related questions
│   ├── dashboard/              # Dashboard widgets
│   ├── admin/                  # Admin components
│   ├── layout/                 # Header, nav, org switcher
│   ├── auth/                   # Login form
│   └── settings/               # Profile form
├── lib/
│   ├── auth.ts                 # NextAuth config (RBAC, org, JWT)
│   ├── db.ts                   # Prisma client singleton
│   ├── utils.ts                # Utility functions (cn)
│   ├── ai/                     # AI/LLM (prompts, RAG pipeline)
│   ├── scraper/                # Web scraping (firecrawl, ingest)
│   └── vector/                 # pgvector integration
├── trpc/
│   ├── init.ts                 # Context, middleware chain (auth → org → admin)
│   ├── routers/                # 10 domain routers
│   │   ├── _app.ts             # Root router
│   │   ├── quickscan.ts        # QuickScan CRUD, priority scores, management summary
│   │   ├── actions.ts          # Action management + kanban
│   │   ├── client-documents.ts # Document hub
│   │   ├── assessment.ts       # Consultant-initiated evaluations + public assessment
│   │   ├── products.ts         # Products + quotes
│   │   ├── benchmark.ts        # Benchmark generation
│   │   ├── organizations.ts    # Multi-tenancy
│   │   ├── chat.ts             # Chat history
│   │   ├── documents.ts        # RAG knowledge base docs
│   │   └── admin.ts            # Admin procedures
│   ├── client.tsx              # Client provider
│   └── server.tsx              # Server-side caller
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
├── env.ts                      # Environment validation (Zod)
└── generated/prisma/           # Prisma generated client (DO NOT EDIT)

prisma/                         # Schema & seed (25+ models)
scripts/                        # Data ingestion scripts
__tests__/                      # Unit tests (Vitest)
tests/                          # E2E tests (Playwright)
```

## Key Conventions

- **Imports from Prisma**: Use `@/generated/prisma/client` (not `@/generated/prisma`)
- **tRPC middleware chain**: `authedProcedure → orgMemberProcedure → orgAdminProcedure`
- **Unused variables**: Prefix with `_` (ESLint configured to allow `_`-prefixed vars)
- **Shared 3x2 matrix**: `src/components/quickscan/matrix-grid.tsx` — reused across features
- **RAG scoring**: ROOD (< 2.0), ORANJE (2.0–3.5), GROEN (> 3.5)
- **QuickScan hub**: One mutable scan per org, no versioning — accessed via `/quick-scan` with `?tab=` param
- **Actions routing**: `/actions` redirects to `/quick-scan?tab=acties`; action detail/create pages link back there
- **Evaluations**: Consultant-initiated only via admin; clients see pending or completed evaluations

## Organization Rules

**Keep code organized and modularized:**

- API procedures → `src/trpc/routers/`, one router per domain
- Pages → `src/app/`, use route groups for layouts
- Components → `src/components/`, one component per file, grouped by feature
- Utilities → `src/lib/`, grouped by functionality
- Hooks → `src/hooks/`, one hook per file
- Types → `src/types/` or co-located with usage
- Unit tests → `__tests__/`, mirroring src/ structure
- E2E tests → `tests/`, one spec per feature

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
bun run lint && bun run type-check
```

Fix ALL errors/warnings before continuing.

## Testing

After code changes, run tests:

```bash
bun run test:run          # Unit tests
bun run test:e2e          # E2E tests (requires dev server)
```

## Database

After schema changes:

```bash
bun run db:generate       # Regenerate Prisma client
bun run db:push           # Push to database
```

## Dev Server

```bash
bun dev                   # Start development server (http://localhost:3000)
```

If changes require server restart (env vars, next.config.ts):

1. Restart server
2. Check terminal for errors
3. Fix ALL warnings before continuing
