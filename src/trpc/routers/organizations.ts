import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import {
  createTRPCRouter,
  authedProcedure,
  globalAdminProcedure,
  orgAdminProcedure,
} from '../init';

export const organizationsRouter = createTRPCRouter({
  /** List orgs the current user belongs to */
  list: authedProcedure.query(async ({ ctx }) => {
    const memberships = await db.organizationUser.findMany({
      where: { userId: ctx.userId },
      include: { organization: true },
      orderBy: { organization: { name: 'asc' } },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      isDefault: m.isDefault,
    }));
  }),

  /** Get single org by id (requires membership) */
  getById: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.userId,
            organizationId: input.organizationId,
          },
        },
        include: {
          organization: {
            include: { users: { include: { user: true } } },
          },
        },
      });

      if (!membership && ctx.session.user.globalRole !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this organization' });
      }

      const org =
        membership?.organization ??
        (await db.organization.findUnique({
          where: { id: input.organizationId },
          include: { users: { include: { user: true } } },
        }));

      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      return org;
    }),

  /** Create org (global admin only) */
  create: globalAdminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await db.organization.findUnique({ where: { slug: input.slug } });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Slug already in use' });
      }

      return db.organization.create({ data: input });
    }),

  /** Update org (org admin) */
  update: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional(),
        logoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, ...data } = input;
      return db.organization.update({
        where: { id: organizationId },
        data,
      });
    }),

  /** Add user to org (org admin) */
  addUser: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(['ADMIN', 'CONSULTANT', 'ACCOUNT_MANAGER', 'CLIENT']),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Check if this is the user's first org — make it default
      const existingMemberships = await db.organizationUser.count({
        where: { userId: input.userId },
      });

      return db.organizationUser.create({
        data: {
          userId: input.userId,
          organizationId: input.organizationId,
          role: input.role,
          isDefault: existingMemberships === 0,
        },
      });
    }),

  /** Remove user from org (org admin) */
  removeUser: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db.organizationUser.delete({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: input.organizationId,
          },
        },
      });
      return { success: true };
    }),

  /** Switch active org for the current user */
  switchOrg: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify membership
      const membership = await db.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.userId,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this organization' });
      }

      // Unset all defaults for this user
      await db.organizationUser.updateMany({
        where: { userId: ctx.userId },
        data: { isDefault: false },
      });

      // Set new default
      await db.organizationUser.update({
        where: { id: membership.id },
        data: { isDefault: true },
      });

      return { success: true };
    }),
});
