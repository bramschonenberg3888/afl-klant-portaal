import { createTRPCRouter, baseProcedure } from "../init";
import { z } from "zod";
import { chatRouter } from "./chat";
import { documentsRouter } from "./documents";
import { adminRouter } from "./admin";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(z.object({ name: z.string() }).optional())
    .query(({ input }) => ({
      greeting: `Hello ${input?.name ?? "World"}!`,
    })),

  getSession: baseProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  chat: chatRouter,
  documents: documentsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
