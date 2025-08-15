import { inngest } from "@/src/inngest/client";
import prisma from "@/src/lib/db";
import { baseProcedure, createTRPCRouter } from "@/src/trpc/init";
import {z} from "zod";

export const messageRouter = createTRPCRouter({
  getMany: baseProcedure
    .query(async ()=>{
      const messages = await prisma.message.findMany({
        orderBy: {
          updatedAt: "desc"
        },
        include:{
          fragment: true
        }
      })
      return messages;
    })
  ,
  
 create: baseProcedure
  .input(
   z.object({
    value: z.string().min(1, { message: "messager is required" })
   }),
  )

  .mutation(async({input})=>{
    const createdMessage = await prisma.message.create({
      data:{
        content: input.value,
        role:"USER",
        type:"RESULT"
      }
    });

    await inngest.send({
      name: "code-agent/run",
      data: {
        content: input.value,
      }
    })

    return createdMessage
  })
   
});