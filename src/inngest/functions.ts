import { gemini, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async () => {
    const summarizer = createAgent({
      name: "code-agent",
      system: "You are an expert Next.js developer. Always provide complete, working code snippets without asking questions. Create practical React components with TypeScript, proper styling, and clear comments.",
      model: gemini({
        model: "gemini-2.0-flash-exp",
      }),
    });

    const prompt = "Create a responsive product card component with image, title, price, and add to cart button using TypeScript and Tailwind CSS";
    const result = await summarizer.run(prompt);

    return { result }
  }
);

