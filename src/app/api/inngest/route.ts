import { inngest } from "@/src/inngest/client";
import { codeAgent } from "@/src/inngest/functions";
import { serve } from "inngest/next";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgent,
  ],
});