import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { createTRPCRouter, orgMemberProcedure, orgAdminProcedure } from '../init';

const LAYERS = ['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'] as const;
const PERSPECTIVES = ['EFFICIENT', 'VEILIG'] as const;

export const quickscanRouter = createTRPCRouter({
  /** Get the latest published scan for an org */
  getLatest: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return db.quickScan.findFirst({
        where: { organizationId: input.organizationId, status: 'PUBLISHED' },
        orderBy: { scanDate: 'desc' },
        include: {
          organization: { select: { name: true } },
          cells: { include: { findings: true } },
          findings: { include: { cell: true }, orderBy: { sortOrder: 'asc' } },
          roadmapItems: { include: { owner: true }, orderBy: { priority: 'desc' } },
          consultant: true,
          accountManager: true,
        },
      });
    }),

  /** Get a specific scan by id */
  getById: orgMemberProcedure
    .input(z.object({ organizationId: z.string(), scanId: z.string() }))
    .query(async ({ input }) => {
      const scan = await db.quickScan.findFirst({
        where: { id: input.scanId, organizationId: input.organizationId },
        include: {
          organization: true,
          cells: { include: { findings: true } },
          findings: { include: { cell: true }, orderBy: { sortOrder: 'asc' } },
          roadmapItems: {
            include: { owner: true },
            orderBy: [{ timeframe: 'asc' }, { priority: 'desc' }],
          },
          consultant: true,
          accountManager: true,
        },
      });

      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }

      return scan;
    }),

  /** Get roadmap items with filters */
  getRoadmap: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        scanId: z.string().optional(),
        timeframe: z.enum(['QUICK_WIN', 'DAYS_30', 'DAYS_60', 'DAYS_90']).optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'DEFERRED']).optional(),
      })
    )
    .query(async ({ input }) => {
      const latestScan = input.scanId
        ? { id: input.scanId }
        : await db.quickScan.findFirst({
            where: { organizationId: input.organizationId, status: 'PUBLISHED' },
            orderBy: { scanDate: 'desc' },
            select: { id: true },
          });

      if (!latestScan) return [];

      return db.roadmapItem.findMany({
        where: {
          scanId: latestScan.id,
          ...(input.timeframe && { timeframe: input.timeframe }),
          ...(input.status && { status: input.status }),
        },
        include: { owner: true },
        orderBy: [{ timeframe: 'asc' }, { priority: 'desc' }],
      });
    }),

  /** Create a new scan (consultant/admin) */
  create: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        title: z.string().min(1),
        consultantId: z.string().optional(),
        accountManagerId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scan = await db.quickScan.create({
        data: {
          organizationId: input.organizationId,
          title: input.title,
          consultantId: input.consultantId,
          accountManagerId: input.accountManagerId,
        },
      });

      // Auto-create 6 empty ScanCells (3 layers x 2 perspectives)
      const cellData = LAYERS.flatMap((layer) =>
        PERSPECTIVES.map((perspective) => ({
          scanId: scan.id,
          layer,
          perspective,
        }))
      );

      await db.scanCell.createMany({ data: cellData });

      logAudit({
        userId: ctx.userId,
        action: 'CREATE',
        resource: 'quickscan',
        resourceId: scan.id,
        details: { title: scan.title },
      });

      return db.quickScan.findUnique({
        where: { id: scan.id },
        include: { cells: true },
      });
    }),

  /** Update a cell score + summary */
  updateCell: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        cellId: z.string(),
        score: z.enum(['ROOD', 'ORANJE', 'GROEN']).optional(),
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const cell = await db.scanCell.findUnique({
        where: { id: input.cellId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!cell || cell.scan.organizationId !== input.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cell not found' });
      }
      return db.scanCell.update({
        where: { id: input.cellId },
        data: {
          ...(input.score !== undefined && { score: input.score }),
          ...(input.summary !== undefined && { summary: input.summary }),
        },
      });
    }),

  /** Add a finding to a scan cell */
  addFinding: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        scanId: z.string(),
        cellId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        efficiencyImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).default('NONE'),
        safetyImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).default('NONE'),
        recommendation: z.string().optional(),
        photoUrls: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, ...data } = input;
      const scan = await db.quickScan.findFirst({
        where: { id: input.scanId, organizationId },
      });
      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }
      return db.scanFinding.create({ data });
    }),

  /** Update a finding */
  updateFinding: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        findingId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        efficiencyImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
        safetyImpact: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
        recommendation: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, findingId, ...data } = input;
      const finding = await db.scanFinding.findUnique({
        where: { id: findingId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!finding || finding.scan.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Finding not found' });
      }
      return db.scanFinding.update({ where: { id: findingId }, data });
    }),

  /** Delete a finding */
  deleteFinding: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), findingId: z.string() }))
    .mutation(async ({ input }) => {
      const finding = await db.scanFinding.findUnique({
        where: { id: input.findingId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!finding || finding.scan.organizationId !== input.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Finding not found' });
      }
      await db.scanFinding.delete({ where: { id: input.findingId } });
      return { success: true };
    }),

  /** Update finding priority scores (impact & effort for prioriteitenmatrix) */
  updateFindingPriority: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        findingId: z.string(),
        impactScore: z.number().min(1).max(5),
        effortScore: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const finding = await db.scanFinding.findUnique({
        where: { id: input.findingId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!finding || finding.scan.organizationId !== input.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Finding not found' });
      }
      return db.scanFinding.update({
        where: { id: input.findingId },
        data: {
          impactScore: input.impactScore,
          effortScore: input.effortScore,
        },
      });
    }),

  /** Update management summary */
  updateManagementSummary: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        scanId: z.string(),
        managementSummary: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const scan = await db.quickScan.findFirst({
        where: { id: input.scanId, organizationId: input.organizationId },
      });
      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }
      return db.quickScan.update({
        where: { id: input.scanId },
        data: { managementSummary: input.managementSummary },
      });
    }),

  /** Add a roadmap item */
  addRoadmapItem: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        scanId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        timeframe: z.enum(['QUICK_WIN', 'DAYS_30', 'DAYS_60', 'DAYS_90']),
        priority: z.number().default(0),
        ownerId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, dueDate, ...data } = input;
      const scan = await db.quickScan.findFirst({
        where: { id: input.scanId, organizationId },
      });
      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }
      return db.roadmapItem.create({
        data: {
          ...data,
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
      });
    }),

  /** Update a roadmap item */
  updateRoadmapItem: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        itemId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        timeframe: z.enum(['QUICK_WIN', 'DAYS_30', 'DAYS_60', 'DAYS_90']).optional(),
        priority: z.number().optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'DEFERRED']).optional(),
        ownerId: z.string().optional(),
        dueDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, itemId, dueDate, ...data } = input;
      const item = await db.roadmapItem.findUnique({
        where: { id: itemId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!item || item.scan.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Roadmap item not found' });
      }
      return db.roadmapItem.update({
        where: { id: itemId },
        data: {
          ...data,
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
      });
    }),

  /** Delete a roadmap item */
  deleteRoadmapItem: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), itemId: z.string() }))
    .mutation(async ({ input }) => {
      const item = await db.roadmapItem.findUnique({
        where: { id: input.itemId },
        include: { scan: { select: { organizationId: true } } },
      });
      if (!item || item.scan.organizationId !== input.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Roadmap item not found' });
      }
      await db.roadmapItem.delete({ where: { id: input.itemId } });
      return { success: true };
    }),

  /** Publish a scan */
  publish: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), scanId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const scan = await db.quickScan.findFirst({
        where: { id: input.scanId, organizationId: input.organizationId },
      });
      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }
      const updated = await db.quickScan.update({
        where: { id: input.scanId },
        data: { status: 'PUBLISHED' },
      });
      logAudit({
        userId: ctx.userId,
        action: 'STATUS_CHANGE',
        resource: 'quickscan',
        resourceId: input.scanId,
        details: { from: scan.status, to: 'PUBLISHED' },
      });
      return updated;
    }),

  /** Update overall summaries */
  updateSummaries: orgAdminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        scanId: z.string(),
        overallEfficiency: z.enum(['ROOD', 'ORANJE', 'GROEN']).optional(),
        overallSafety: z.enum(['ROOD', 'ORANJE', 'GROEN']).optional(),
        summary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, scanId, ...data } = input;
      const scan = await db.quickScan.findFirst({
        where: { id: scanId, organizationId },
      });
      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }
      return db.quickScan.update({ where: { id: scanId }, data });
    }),
});
