import { z } from 'zod';
import { db } from '@/lib/db';
import { createTRPCRouter, globalAdminProcedure } from '../init';

export const auditRouter = createTRPCRouter({
  /** List audit logs with cursor pagination and filters */
  list: globalAdminProcedure
    .input(
      z.object({
        resource: z.string().optional(),
        action: z.string().optional(),
        userId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { resource, action, userId, cursor, limit } = input;

      const logs = await db.auditLog.findMany({
        where: {
          ...(resource && { resource }),
          ...(action && { action }),
          ...(userId && { userId }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      let nextCursor: string | undefined;
      if (logs.length > limit) {
        const next = logs.pop();
        nextCursor = next?.id;
      }

      return { logs, nextCursor };
    }),
});
