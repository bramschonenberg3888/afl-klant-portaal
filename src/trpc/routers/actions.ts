import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createTRPCRouter, authedProcedure, orgMemberProcedure, orgAdminProcedure } from '../init';

export const actionsRouter = createTRPCRouter({
  /** List actions with filters */
  list: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'DEFERRED', 'CANCELLED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        assigneeId: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        perspective: z.enum(['EFFICIENT', 'VEILIG']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { organizationId, status, priority, assigneeId, layer, perspective, cursor, limit } =
        input;

      const actions = await db.action.findMany({
        where: {
          organizationId,
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assigneeId && { assigneeId }),
          ...(layer && { layer }),
          ...(perspective && { perspective }),
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          assignee: true,
          reporter: true,
          finding: true,
        },
      });

      let nextCursor: string | undefined;
      if (actions.length > limit) {
        const next = actions.pop();
        nextCursor = next?.id;
      }

      return { actions, nextCursor };
    }),

  /** Get action by id with comments */
  getById: orgMemberProcedure
    .input(z.object({ organizationId: z.string(), actionId: z.string() }))
    .query(async ({ input }) => {
      const action = await db.action.findFirst({
        where: { id: input.actionId, organizationId: input.organizationId },
        include: {
          assignee: true,
          reporter: true,
          finding: { include: { cell: true } },
          comments: {
            include: { author: true },
            orderBy: { createdAt: 'asc' },
          },
          organization: true,
        },
      });

      if (!action) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
      }

      return action;
    }),

  /** Create an action */
  create: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        perspective: z.enum(['EFFICIENT', 'VEILIG']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
        assigneeId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        findingId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, dueDate, ...data } = input;
      const action = await db.action.create({
        data: {
          ...data,
          organizationId,
          reporterId: ctx.userId,
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
      });
      logAudit({
        userId: ctx.userId,
        action: 'CREATE',
        resource: 'action',
        resourceId: action.id,
        details: { title: action.title },
      });
      return action;
    }),

  /** Update an action */
  update: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        actionId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        perspective: z.enum(['EFFICIENT', 'VEILIG']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        assigneeId: z.string().nullable().optional(),
        dueDate: z.string().datetime().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, actionId, dueDate, ...data } = input;
      const existing = await db.action.findFirst({
        where: { id: actionId, organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
      }
      const updated = await db.action.update({
        where: { id: actionId },
        data: {
          ...data,
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
      });
      logAudit({
        userId: ctx.userId,
        action: 'UPDATE',
        resource: 'action',
        resourceId: actionId,
        details: { changes: data },
      });
      return updated;
    }),

  /** Update just the status */
  updateStatus: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        actionId: z.string(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'DEFERRED', 'CANCELLED']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.action.findFirst({
        where: { id: input.actionId, organizationId: input.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
      }
      const updated = await db.action.update({
        where: { id: input.actionId },
        data: {
          status: input.status,
          ...(input.status === 'DONE' && { completedAt: new Date() }),
        },
      });
      logAudit({
        userId: ctx.userId,
        action: 'STATUS_CHANGE',
        resource: 'action',
        resourceId: input.actionId,
        details: { from: existing.status, to: input.status },
      });
      return updated;
    }),

  /** Delete an action */
  delete: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), actionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.action.findFirst({
        where: { id: input.actionId, organizationId: input.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
      }
      await db.action.delete({ where: { id: input.actionId } });
      logAudit({
        userId: ctx.userId,
        action: 'DELETE',
        resource: 'action',
        resourceId: input.actionId,
        details: { title: existing.title },
      });
      return { success: true };
    }),

  /** Add a comment */
  addComment: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        actionId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const action = await db.action.findFirst({
        where: { id: input.actionId, organizationId: input.organizationId },
      });
      if (!action) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action not found' });
      }
      return db.actionComment.create({
        data: {
          actionId: input.actionId,
          authorId: ctx.userId,
          content: input.content,
        },
        include: { author: true },
      });
    }),

  /** Get action stats for an org */
  getStats: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const [total, todo, inProgress, done, deferred, cancelled] = await Promise.all([
        db.action.count({ where: { organizationId: input.organizationId } }),
        db.action.count({ where: { organizationId: input.organizationId, status: 'TODO' } }),
        db.action.count({ where: { organizationId: input.organizationId, status: 'IN_PROGRESS' } }),
        db.action.count({ where: { organizationId: input.organizationId, status: 'DONE' } }),
        db.action.count({ where: { organizationId: input.organizationId, status: 'DEFERRED' } }),
        db.action.count({ where: { organizationId: input.organizationId, status: 'CANCELLED' } }),
      ]);

      return { total, todo, inProgress, done, deferred, cancelled };
    }),

  /** Get current user's actions across orgs */
  getMyActions: authedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return db.action.findMany({
        where: { assigneeId: ctx.userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: input.limit,
        include: { organization: true },
      });
    }),

  /** Create action from a scan finding */
  createFromFinding: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        findingId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const finding = await db.scanFinding.findUnique({
        where: { id: input.findingId },
        include: { cell: true },
      });

      if (!finding) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Finding not found' });
      }

      return db.action.create({
        data: {
          organizationId: input.organizationId,
          title: finding.title,
          description: finding.recommendation ?? finding.description,
          layer: finding.cell.layer,
          perspective: finding.cell.perspective,
          reporterId: ctx.userId,
          findingId: finding.id,
        },
      });
    }),
});
