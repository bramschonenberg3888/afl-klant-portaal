import { createTRPCRouter, baseProcedure } from '../init';
import { z } from 'zod';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';

export const documentsRouter = createTRPCRouter({
  list: baseProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const documents = await db.document.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          sourceUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { chunks: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (documents.length > limit) {
        const nextItem = documents.pop();
        nextCursor = nextItem?.id;
      }

      return {
        documents,
        nextCursor,
      };
    }),

  getById: baseProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const document = await db.document.findUnique({
      where: { id: input.id },
      include: {
        chunks: {
          select: {
            id: true,
            chunkIndex: true,
            content: true,
          },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!document) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }

    return document;
  }),

  delete: baseProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const document = await db.document.findUnique({
      where: { id: input.id },
    });

    if (!document) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
    }

    await db.document.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  getStats: baseProcedure.query(async () => {
    const [documentCount, chunkCount] = await Promise.all([
      db.document.count(),
      db.documentChunk.count(),
    ]);

    return {
      documentCount,
      chunkCount,
    };
  }),
});
