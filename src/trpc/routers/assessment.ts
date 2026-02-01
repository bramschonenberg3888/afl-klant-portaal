import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { createTRPCRouter, baseProcedure, authedProcedure, orgMemberProcedure } from '../init';
import type { RAGScore } from '@/generated/prisma/client';

function computeRAGScore(rawScore: number): RAGScore {
  if (rawScore < 2.0) return 'ROOD';
  if (rawScore <= 3.5) return 'ORANJE';
  return 'GROEN';
}

export const assessmentRouter = createTRPCRouter({
  /** Get the active template with questions (public, no auth) */
  getActiveTemplate: baseProcedure.query(async () => {
    return db.assessmentTemplate.findFirst({
      where: { isActive: true },
      include: {
        questions: { orderBy: [{ layer: 'asc' }, { perspective: 'asc' }, { sortOrder: 'asc' }] },
      },
    });
  }),

  /** Start a new assessment */
  startAssessment: baseProcedure
    .input(
      z.object({
        templateId: z.string(),
        userId: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.assessmentResponse.create({
        data: {
          templateId: input.templateId,
          userId: input.userId,
          organizationId: input.organizationId,
        },
      });
    }),

  /** Save a single answer */
  saveAnswer: baseProcedure
    .input(
      z.object({
        responseId: z.string(),
        questionId: z.string(),
        score: z.number().min(1).max(5),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.assessmentAnswer.upsert({
        where: {
          responseId_questionId: {
            responseId: input.responseId,
            questionId: input.questionId,
          },
        },
        update: { score: input.score, notes: input.notes },
        create: {
          responseId: input.responseId,
          questionId: input.questionId,
          score: input.score,
          notes: input.notes,
        },
      });
    }),

  /** Save batch answers */
  saveBatchAnswers: baseProcedure
    .input(
      z.object({
        responseId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            score: z.number().min(1).max(5),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const ops = input.answers.map((a) =>
        db.assessmentAnswer.upsert({
          where: {
            responseId_questionId: {
              responseId: input.responseId,
              questionId: a.questionId,
            },
          },
          update: { score: a.score, notes: a.notes },
          create: {
            responseId: input.responseId,
            questionId: a.questionId,
            score: a.score,
            notes: a.notes,
          },
        })
      );

      return db.$transaction(ops);
    }),

  /** Complete assessment — compute result cells */
  completeAssessment: baseProcedure
    .input(
      z.object({
        responseId: z.string(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactCompany: z.string().optional(),
        contactPhone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await db.assessmentResponse.findUnique({
        where: { id: input.responseId },
        include: {
          answers: { include: { question: true } },
        },
      });

      if (!response) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Assessment not found' });
      }

      // Group by (layer, perspective) and compute weighted average
      const groups = new Map<string, { totalWeight: number; weightedSum: number }>();

      for (const answer of response.answers) {
        const key = `${answer.question.layer}:${answer.question.perspective}`;
        const existing = groups.get(key) ?? { totalWeight: 0, weightedSum: 0 };
        existing.totalWeight += answer.question.weight;
        existing.weightedSum += answer.score * answer.question.weight;
        groups.set(key, existing);
      }

      // Delete existing result cells then create new ones
      await db.assessmentResultCell.deleteMany({
        where: { responseId: input.responseId },
      });

      const resultCells = Array.from(groups.entries()).map(([key, data]) => {
        const [layer, perspective] = key.split(':') as [string, string];
        const rawScore = data.totalWeight > 0 ? data.weightedSum / data.totalWeight : 0;
        return {
          responseId: input.responseId,
          layer: layer as 'RUIMTE_INRICHTING' | 'WERKWIJZE_PROCESSEN' | 'ORGANISATIE_BESTURING',
          perspective: perspective as 'EFFICIENT' | 'VEILIG',
          score: computeRAGScore(rawScore),
          rawScore,
        };
      });

      await db.assessmentResultCell.createMany({ data: resultCells });

      // Update response status and contact info
      await db.assessmentResponse.update({
        where: { id: input.responseId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          ...(input.contactName && { contactName: input.contactName }),
          ...(input.contactEmail && { contactEmail: input.contactEmail }),
          ...(input.contactCompany && { contactCompany: input.contactCompany }),
          ...(input.contactPhone && { contactPhone: input.contactPhone }),
        },
      });

      return { resultCells };
    }),

  /** Get assessment result */
  getResult: baseProcedure.input(z.object({ responseId: z.string() })).query(async ({ input }) => {
    return db.assessmentResponse.findUnique({
      where: { id: input.responseId },
      include: {
        resultCells: true,
        answers: { include: { question: true } },
        template: true,
      },
    });
  }),

  /** Get user's assessments */
  getMyAssessments: authedProcedure.query(async ({ ctx }) => {
    return db.assessmentResponse.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      include: { resultCells: true, template: true },
    });
  }),

  /** Get org assessments */
  getOrgAssessments: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return db.assessmentResponse.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: 'desc' },
        include: { resultCells: true, template: true, user: true },
      });
    }),
});
