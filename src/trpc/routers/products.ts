import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { createTRPCRouter, baseProcedure, authedProcedure, globalAdminProcedure } from '../init';

export const productsRouter = createTRPCRouter({
  /** List products with filters */
  list: authedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { category, layer, search, cursor, limit } = input;

      const products = await db.product.findMany({
        where: {
          isActive: true,
          ...(category && { category }),
          ...(layer && { layer }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }),
        },
        orderBy: { name: 'asc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (products.length > limit) {
        const next = products.pop();
        nextCursor = next?.id;
      }

      return { products, nextCursor };
    }),

  /** Get product by id */
  getById: authedProcedure.input(z.object({ productId: z.string() })).query(async ({ input }) => {
    const product = await db.product.findUnique({
      where: { id: input.productId },
      include: {
        recommendations: {
          include: { finding: true, action: true },
        },
      },
    });

    if (!product) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });
    }

    return product;
  }),

  /** Get product recommendations for a scan */
  getRecommendationsForScan: authedProcedure
    .input(z.object({ scanId: z.string() }))
    .query(async ({ input }) => {
      return db.productRecommendation.findMany({
        where: { finding: { scanId: input.scanId } },
        include: { product: true, finding: true },
        orderBy: { sortOrder: 'asc' },
      });
    }),

  /** Get product recommendations for an action */
  getRecommendationsForAction: authedProcedure
    .input(z.object({ actionId: z.string() }))
    .query(async ({ input }) => {
      return db.productRecommendation.findMany({
        where: { actionId: input.actionId },
        include: { product: true },
        orderBy: { sortOrder: 'asc' },
      });
    }),

  /** Request a quote */
  requestQuote: baseProcedure
    .input(
      z.object({
        productId: z.string().optional(),
        organizationId: z.string().optional(),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.quoteRequest.create({
        data: {
          ...input,
          userId: ctx.userId,
        },
      });
    }),

  /** List quote requests (admin) */
  listQuoteRequests: globalAdminProcedure
    .input(
      z.object({
        status: z.enum(['NEW', 'CONTACTED', 'QUOTED', 'CLOSED']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return db.quoteRequest.findMany({
        where: input.status ? { status: input.status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        include: { product: true, user: true, organization: true },
      });
    }),

  /** Create product (admin) */
  createProduct: globalAdminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        imageUrl: z.string().url().optional(),
        productUrl: z.string().url().optional(),
        priceRange: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.product.create({ data: input });
    }),

  /** Update product (admin) */
  updateProduct: globalAdminProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        layer: z
          .enum(['RUIMTE_INRICHTING', 'WERKWIJZE_PROCESSEN', 'ORGANISATIE_BESTURING'])
          .optional(),
        imageUrl: z.string().url().optional(),
        productUrl: z.string().url().optional(),
        priceRange: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { productId, ...data } = input;
      return db.product.update({ where: { id: productId }, data });
    }),

  /** Delete product (admin) */
  deleteProduct: globalAdminProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input }) => {
      await db.product.delete({ where: { id: input.productId } });
      return { success: true };
    }),

  /** Link product to finding (admin) */
  linkToFinding: globalAdminProcedure
    .input(
      z.object({
        productId: z.string(),
        findingId: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.productRecommendation.create({
        data: {
          productId: input.productId,
          findingId: input.findingId,
          context: input.context,
        },
      });
    }),

  /** Unlink product from finding (admin) */
  unlinkFromFinding: globalAdminProcedure
    .input(z.object({ recommendationId: z.string() }))
    .mutation(async ({ input }) => {
      await db.productRecommendation.delete({ where: { id: input.recommendationId } });
      return { success: true };
    }),
});
