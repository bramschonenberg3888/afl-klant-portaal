import { z } from 'zod';
import { db } from '@/lib/db';
import {
  createTRPCRouter,
  authedProcedure,
  orgMemberProcedure,
  globalAdminProcedure,
} from '../init';
import type { Layer, Perspective, RAGScore } from '@/generated/prisma/client';

interface BenchmarkData {
  cells: Array<{
    layer: Layer;
    perspective: Perspective;
    distribution: Record<RAGScore, number>;
    average: number;
    total: number;
  }>;
}

const SCORE_VALUES: Record<RAGScore, number> = {
  ROOD: 1,
  ORANJE: 2,
  GROEN: 3,
};

export const benchmarkRouter = createTRPCRouter({
  /** Get the latest benchmark snapshot */
  getLatestBenchmark: authedProcedure.query(async () => {
    const snapshot = await db.benchmarkSnapshot.findFirst({
      orderBy: { generatedAt: 'desc' },
    });

    if (!snapshot) return null;

    return {
      ...snapshot,
      data: JSON.parse(snapshot.data) as BenchmarkData,
    };
  }),

  /** Get org's position relative to benchmark */
  getMyPosition: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const [snapshot, latestScan] = await Promise.all([
        db.benchmarkSnapshot.findFirst({ orderBy: { generatedAt: 'desc' } }),
        db.quickScan.findFirst({
          where: { organizationId: input.organizationId, status: 'PUBLISHED' },
          orderBy: { scanDate: 'desc' },
          include: { cells: true },
        }),
      ]);

      if (!snapshot || !latestScan) return null;

      const benchmarkData = JSON.parse(snapshot.data) as BenchmarkData;

      return {
        scan: latestScan,
        benchmark: benchmarkData,
        totalScans: snapshot.totalScans,
      };
    }),

  /** Generate a new benchmark from all published scans (admin) */
  generateBenchmark: globalAdminProcedure.mutation(async () => {
    const allCells = await db.scanCell.findMany({
      where: { scan: { status: 'PUBLISHED' }, score: { not: null } },
      include: { scan: true },
    });

    // Count unique scans
    const scanIds = new Set(allCells.map((c) => c.scanId));
    const totalScans = scanIds.size;

    // Group by (layer, perspective)
    const groups = new Map<string, RAGScore[]>();

    for (const cell of allCells) {
      if (!cell.score) continue;
      const key = `${cell.layer}:${cell.perspective}`;
      const existing = groups.get(key) ?? [];
      existing.push(cell.score);
      groups.set(key, existing);
    }

    const cells = Array.from(groups.entries()).map(([key, scores]) => {
      const [layer, perspective] = key.split(':') as [Layer, Perspective];
      const distribution: Record<RAGScore, number> = { ROOD: 0, ORANJE: 0, GROEN: 0 };

      let sum = 0;
      for (const score of scores) {
        distribution[score]++;
        sum += SCORE_VALUES[score];
      }

      return {
        layer,
        perspective,
        distribution,
        average: scores.length > 0 ? sum / scores.length : 0,
        total: scores.length,
      };
    });

    const data: BenchmarkData = { cells };

    const snapshot = await db.benchmarkSnapshot.create({
      data: {
        totalScans,
        data: JSON.stringify(data),
      },
    });

    return {
      ...snapshot,
      data,
    };
  }),
});
