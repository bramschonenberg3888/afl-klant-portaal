import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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

/**
 * Authenticated procedure — ensures ctx.session.user exists
 */
export const authedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

/**
 * Global admin procedure — checks user.globalRole === ADMIN
 */
export const globalAdminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.globalRole !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

/**
 * Org input schema used by middleware to extract organizationId
 */
const orgInputSchema = z.object({ organizationId: z.string() });

/**
 * Org member procedure — parses organizationId from input,
 * queries OrganizationUser, adds org + membership to context.
 */
export const orgMemberProcedure = authedProcedure.use(async ({ ctx, next, getRawInput }) => {
  const rawInput = await getRawInput();
  const parsed = orgInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'organizationId is required',
    });
  }

  const { organizationId } = parsed.data;

  const membership = await db.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: ctx.userId,
        organizationId,
      },
    },
    include: { organization: true },
  });

  // Global admins can access any org even without membership
  if (!membership && ctx.session.user.globalRole !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not a member of this organization',
    });
  }

  const org =
    membership?.organization ??
    (await db.organization.findUnique({
      where: { id: organizationId },
    }));

  if (!org) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
  }

  return next({
    ctx: {
      ...ctx,
      org,
      membership,
      orgRole:
        membership?.role ??
        (ctx.session.user.globalRole === 'ADMIN' ? ('ADMIN' as const) : undefined),
    },
  });
});

/**
 * Org admin procedure — checks membership role is ADMIN or CONSULTANT
 */
export const orgAdminProcedure = orgMemberProcedure.use(async ({ ctx, next }) => {
  const role = ctx.orgRole;
  if (role !== 'ADMIN' && role !== 'CONSULTANT') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization admin or consultant access required',
    });
  }
  return next({ ctx });
});
