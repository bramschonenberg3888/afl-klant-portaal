import { createTRPCRouter, baseProcedure } from '../init';
import { z } from 'zod';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { ingestUrl, ingestMultipleUrls, reprocessDocument } from '@/lib/scraper/ingest';

export const adminRouter = createTRPCRouter({
  ingestUrl: baseProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
      }

      const result = await ingestUrl(input.url);
      return result;
    }),

  ingestMultipleUrls: baseProcedure
    .input(z.object({ urls: z.array(z.string().url()).min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
      }

      const results = await ingestMultipleUrls(input.urls);
      return {
        results,
        successCount: results.length,
        totalRequested: input.urls.length,
      };
    }),

  reprocessDocument: baseProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
      }

      const result = await reprocessDocument(input.documentId);
      return result;
    }),

  getUsers: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }),

  deleteUser: baseProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
      }

      // Prevent self-deletion
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete your own account' });
      }

      await db.user.delete({
        where: { id: input.userId },
      });

      return { success: true };
    }),

  getDashboardStats: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
    }

    const [userCount, documentCount, chunkCount, conversationCount, messageCount] =
      await Promise.all([
        db.user.count(),
        db.document.count(),
        db.documentChunk.count(),
        db.conversation.count(),
        db.message.count(),
      ]);

    return {
      userCount,
      documentCount,
      chunkCount,
      conversationCount,
      messageCount,
    };
  }),
});
