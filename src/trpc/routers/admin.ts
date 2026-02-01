import { createTRPCRouter, authedProcedure } from '../init';
import { z } from 'zod';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { ingestUrl, ingestMultipleUrls, reprocessDocument } from '@/lib/scraper/ingest';

export const adminRouter = createTRPCRouter({
  ingestUrl: authedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const result = await ingestUrl(input.url);
      return result;
    }),

  ingestMultipleUrls: authedProcedure
    .input(z.object({ urls: z.array(z.string().url()).min(1).max(50) }))
    .mutation(async ({ input }) => {
      const results = await ingestMultipleUrls(input.urls);
      return {
        results,
        successCount: results.length,
        totalRequested: input.urls.length,
      };
    }),

  reprocessDocument: authedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await reprocessDocument(input.documentId);
      return result;
    }),

  getUsers: authedProcedure.query(async () => {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        globalRole: true,
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }),

  deleteUser: authedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (ctx.userId === input.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete your own account' });
      }

      await db.user.delete({
        where: { id: input.userId },
      });

      return { success: true };
    }),

  getDashboardStats: authedProcedure.query(async () => {
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
