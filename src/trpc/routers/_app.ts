import { createTRPCRouter, baseProcedure } from '../init';
import { z } from 'zod';
import { chatRouter } from './chat';
import { documentsRouter } from './documents';
import { adminRouter } from './admin';
import { organizationsRouter } from './organizations';
import { quickscanRouter } from './quickscan';
import { actionsRouter } from './actions';
import { clientDocumentsRouter } from './client-documents';
import { assessmentRouter } from './assessment';
import { productsRouter } from './products';
import { benchmarkRouter } from './benchmark';
import { auditRouter } from './audit';

export const appRouter = createTRPCRouter({
  hello: baseProcedure.input(z.object({ name: z.string() }).optional()).query(({ input }) => ({
    greeting: `Hello ${input?.name ?? 'World'}!`,
  })),

  getSession: baseProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  chat: chatRouter,
  documents: documentsRouter,
  admin: adminRouter,
  organizations: organizationsRouter,
  quickscan: quickscanRouter,
  actions: actionsRouter,
  clientDocuments: clientDocumentsRouter,
  assessment: assessmentRouter,
  products: productsRouter,
  benchmark: benchmarkRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
