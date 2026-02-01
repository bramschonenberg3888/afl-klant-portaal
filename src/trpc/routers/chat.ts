import { createTRPCRouter, authedProcedure, baseProcedure } from '../init';
import { z } from 'zod';
import { db } from '@/lib/db';
import { TRPCError } from '@trpc/server';

export const chatRouter = createTRPCRouter({
  getConversations: baseProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      return [];
    }

    return db.conversation.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),

  getConversation: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.conversation.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      // Check ownership if user is authenticated
      if (ctx.userId && conversation.userId && conversation.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      return conversation;
    }),

  deleteConversation: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Must be logged in' });
      }

      const conversation = await db.conversation.findUnique({
        where: { id: input.id },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      if (conversation.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      await db.conversation.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  submitFeedback: authedProcedure
    .input(
      z.object({
        messageId: z.string(),
        feedback: z.enum(['positive', 'negative']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await db.message.findUnique({
        where: { id: input.messageId },
        include: { conversation: { select: { userId: true } } },
      });

      if (!message) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
      }

      if (message.conversation.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      await db.message.update({
        where: { id: input.messageId },
        data: { feedback: input.feedback },
      });

      return { success: true };
    }),
});
