import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { auth } from '@/lib/auth';

/**
 * Create tRPC context
 */
export const createTRPCContext = cache(async () => {
  const session = await auth();
  return {
    session,
    userId: session?.user?.id,
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
