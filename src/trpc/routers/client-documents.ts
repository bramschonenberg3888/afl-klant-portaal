import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import {
  createTRPCRouter,
  authedProcedure,
  orgMemberProcedure,
  orgAdminProcedure,
} from '../init';

const categories = [
  'QUICKSCAN_REPORT', 'COMPLIANCE', 'SAFETY', 'WORK_INSTRUCTIONS',
  'CERTIFICATES', 'TRAINING', 'TEMPLATE', 'OTHER',
] as const;

export const clientDocumentsRouter = createTRPCRouter({
  /** List documents with filters */
  list: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        category: z.enum(categories).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { organizationId, category, search, cursor, limit } = input;

      const documents = await db.clientDocument.findMany({
        where: {
          organizationId,
          parentId: null, // Only root documents (not versions)
          ...(category && { category }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          uploadedBy: true,
          _count: { select: { versions: true } },
        },
      });

      let nextCursor: string | undefined;
      if (documents.length > limit) {
        const next = documents.pop();
        nextCursor = next?.id;
      }

      return { documents, nextCursor };
    }),

  /** Get document by id with version history */
  getById: authedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const doc = await db.clientDocument.findUnique({
        where: { id: input.documentId },
        include: {
          uploadedBy: true,
          organization: true,
          versions: {
            orderBy: { version: 'desc' },
            include: { uploadedBy: true },
          },
        },
      });

      if (!doc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      return doc;
    }),

  /** Create (upload) a new document record */
  upload: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(categories).default('OTHER'),
        fileUrl: z.string().url(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        expiresAt: z.string().datetime().optional(),
        isTemplate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, expiresAt, ...data } = input;
      return db.clientDocument.create({
        data: {
          ...data,
          organizationId,
          uploadedById: ctx.userId,
          ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        },
      });
    }),

  /** Update document metadata */
  update: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        documentId: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum(categories).optional(),
        expiresAt: z.string().datetime().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId: _organizationId, documentId, expiresAt, ...data } = input;
      return db.clientDocument.update({
        where: { id: documentId },
        data: {
          ...data,
          ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        },
      });
    }),

  /** Upload a new version of a document */
  uploadNewVersion: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        parentId: z.string(),
        fileUrl: z.string().url(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parent = await db.clientDocument.findUnique({
        where: { id: input.parentId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
      });

      if (!parent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent document not found' });
      }

      const latestVersion = parent.versions[0]?.version ?? parent.version;

      return db.clientDocument.create({
        data: {
          organizationId: input.organizationId,
          title: parent.title,
          description: parent.description,
          category: parent.category,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          version: latestVersion + 1,
          parentId: input.parentId,
          uploadedById: ctx.userId,
        },
      });
    }),

  /** Delete a document */
  delete: orgAdminProcedure
    .input(z.object({ organizationId: z.string(), documentId: z.string() }))
    .mutation(async ({ input }) => {
      await db.clientDocument.delete({ where: { id: input.documentId } });
      return { success: true };
    }),

  /** Get documents expiring within N days */
  getExpiringSoon: orgMemberProcedure
    .input(
      z.object({
        organizationId: z.string(),
        daysAhead: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + input.daysAhead);

      return db.clientDocument.findMany({
        where: {
          organizationId: input.organizationId,
          expiresAt: { lte: cutoff },
          parentId: null,
        },
        orderBy: { expiresAt: 'asc' },
        include: { uploadedBy: true },
      });
    }),

  /** Get template documents */
  getTemplates: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return db.clientDocument.findMany({
        where: {
          organizationId: input.organizationId,
          isTemplate: true,
          parentId: null,
        },
        orderBy: { title: 'asc' },
      });
    }),

  /** Get document counts by category */
  getByCategory: orgMemberProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      const counts = await db.clientDocument.groupBy({
        by: ['category'],
        where: { organizationId: input.organizationId, parentId: null },
        _count: true,
      });

      return counts.map((c) => ({ category: c.category, count: c._count }));
    }),
});
