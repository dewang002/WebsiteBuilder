import { createTRPCRouter } from '@/src/trpc/init';
import { messageRouter } from '@/src/modules/messages/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messageRouter
  
  // invoke: baseProcedure
  //   .input(
  //     z.object({
  //       value: z.string(),
  //     })
  //   )
  //   .mutation(async ({ input }) => {
  //     await inngest.send({
  //       name: "test/hello.world",
  //       data: {
  //         email: input.value,
  //       }
  //     })
  //     return { ok: 'success' }
  //   })
  // ,
  // hello: baseProcedure
  //   .input(
  //     z.object({
  //       text: z.string(),
  //     }),
  //   )
  //   .query((opts) => {
  //     return {
  //       greeting: `hello ${opts.input.text}`,
  //     };
  //   }),
});

// export type definition of API
export type AppRouter = typeof appRouter;