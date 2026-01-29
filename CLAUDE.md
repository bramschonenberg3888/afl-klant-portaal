# AFL Klant Portaal - Warehouse Safety Portal

Multi-tenant warehouse safety compliance portal with AI chatbot for Logistiekconcurrent.nl customers. Provides RAG-powered answers to warehouse compliance questions (RI&E, Arbobesluit, 2026 enforcement changes).

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth routes
│   │   ├── chat/             # Chat API endpoint (streaming)
│   │   └── trpc/[trpc]/      # tRPC endpoint
│   ├── (auth)/               # Auth pages (login)
│   ├── (dashboard)/          # Protected pages (home, chat, admin, settings)
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui base components
│   ├── chat/                 # Chat (layout, interface, conversation-list, message, related-questions)
│   ├── dashboard/            # Dashboard widgets (stats, recent-chats)
│   ├── admin/                # Admin panel (usage-stats, users-table)
│   ├── layout/               # Layout components (dashboard-header, logo)
│   ├── auth/                 # Auth components (login-form)
│   ├── settings/             # Settings components (profile-form)
│   └── quick-scan/           # Quick-scan compliance checker
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client singleton
│   ├── utils.ts              # Utility functions (cn)
│   ├── ai/                   # AI/LLM integration (index, prompts, rag)
│   ├── scraper/              # Web scraping (firecrawl, ingest)
│   └── vector/               # pgvector integration
├── trpc/
│   ├── init.ts               # tRPC context & router setup
│   ├── routers/              # API routers (admin, chat, documents)
│   ├── client.tsx            # Client provider
│   └── server.tsx            # Server-side caller
├── hooks/                    # Custom React hooks (use-mobile, use-scroll-to-bottom)
├── types/                    # TypeScript type definitions
├── env.ts                    # Environment validation (Zod)
└── generated/                # Prisma generated client (DO NOT EDIT)

prisma/                       # Database schema & seed
scripts/                      # Utility scripts (data ingestion)
__tests__/                    # Unit tests (Vitest)
tests/                        # E2E tests (Playwright)
```

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
