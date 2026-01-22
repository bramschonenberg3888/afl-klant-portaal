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
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Homepage
├── components/
│   ├── chat/                 # Chat interface components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client singleton
│   ├── utils.ts              # Utility functions (cn)
│   ├── ai/                   # AI/LLM integration (RAG, prompts)
│   ├── scraper/              # Web scraping (Firecrawl, ingestion)
│   └── vector/               # pgvector integration
├── trpc/
│   ├── init.ts               # tRPC context & router setup
│   ├── routers/              # API routers (admin, chat, documents)
│   ├── client.tsx            # Client provider
│   ├── server.tsx            # Server-side caller
│   └── query-client.ts       # React Query config
├── types/                    # TypeScript type definitions
├── env.ts                    # Environment validation (Zod)
└── generated/                # Prisma generated client (DO NOT EDIT)

prisma/
└── schema.prisma             # Database schema (User, Document, Conversation, Message)

scripts/                      # Utility scripts (data ingestion)
__tests__/                    # Unit tests (Vitest)
tests/                        # E2E tests (Playwright)
```

## Organization Rules

**Keep code organized and modularized:**
- API procedures → `src/trpc/routers/`, one router per domain
- Components → `src/components/`, one component per file
- Utilities → `src/lib/`, grouped by functionality
- Types → `src/types/` or co-located with usage
- Unit tests → `__tests__/`, mirroring src/ structure
- E2E tests → `tests/`, one spec per feature

**Modularity principles:**
- Single responsibility per file
- Clear, descriptive file names
- Group related functionality together
- Avoid monolithic files

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
bun db:generate           # Regenerate Prisma client
bun db:push               # Push to database
```

## Dev Server

```bash
bun dev                   # Start development server
```

If changes require server restart (env vars, next.config.ts):
1. Restart server
2. Check terminal for errors
3. Fix ALL warnings before continuing
