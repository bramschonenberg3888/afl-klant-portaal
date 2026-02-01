import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import {
  createTRPCRouter,
  authedProcedure,
  orgMemberProcedure,
  orgAdminProcedure,
} from '../init';

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
          cells: { include: { findings: true } },
          findings: true,
          roadmapItems: { include: { owner: true }, orderBy: { priority: 'desc' } },
          consultant: true,
          accountManager: true,
        },
      });
    }),

  /** Get a specific scan by id */
  getById: authedProcedure
    .input(z.object({ scanId: z.string() }))
    .query(async ({ input }) => {
      const scan = await db.quickScan.findUnique({
        where: { id: input.scanId },
        include: {
          organization: true,
          cells: { include: { findings: true } },
          findings: { include: { cell: true }, orderBy: { sortOrder: 'asc' } },
          roadmapItems: { include: { owner: true }, orderBy: [{ timeframe: 'asc' }, { priority: 'desc' }] },
          consultant: true,
          accountManager: true,
        },
      });

      if (!scan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found' });
      }

      return scan;
    }),

  /** List scans for an org */
  listForOrg: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const scans = await db.quickScan.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { scanDate: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          cells: true,
          consultant: true,
          _count: { select: { findings: true, roadmapItems: true } },
        },
      });

      let nextCursor: string | undefined;
      if (scans.length > input.limit) {
        const next = scans.pop();
        nextCursor = next?.id;
      }

      return { scans, nextCursor };
    }),

  /** Compare two scans side-by-side */
  compareTwoScans: authedProcedure
    .input(z.object({ scanIdA: z.string(), scanIdB: z.string() }))
    .query(async ({ input }) => {
      const [scanA, scanB] = await Promise.all([
        db.quickScan.findUnique({
          where: { id: input.scanIdA },
          include: { cells: true },
        }),
        db.quickScan.findUnique({
          where: { id: input.scanIdB },
          include: { cells: true },
        }),
      ]);

      if (!scanA || !scanB) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'One or both scans not found' });
      }

      return { scanA, scanB };
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
    .mutation(async ({ input }) => {
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
      const { organizationId: _organizationId, ...data } = input;
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
      const { organizationId: _organizationId, findingId, ...data } = input;
      return db.scanFinding.update({ where: { id: findingId }, data });
    }),

  /** Delete a finding */
  deleteFinding: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), findingId: z.string() }))
    .mutation(async ({ input }) => {
      await db.scanFinding.delete({ where: { id: input.findingId } });
      return { success: true };
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
      const { organizationId: _organizationId, dueDate, ...data } = input;
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
      const { organizationId: _organizationId, itemId, dueDate, ...data } = input;
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
      await db.roadmapItem.delete({ where: { id: input.itemId } });
      return { success: true };
    }),

  /** Publish a scan */
  publish: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), scanId: z.string() }))
    .mutation(async ({ input }) => {
      return db.quickScan.update({
        where: { id: input.scanId },
        data: { status: 'PUBLISHED' },
      });
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
      const { organizationId: _organizationId, scanId, ...data } = input;
      return db.quickScan.update({ where: { id: scanId }, data });
    }),
});
