import { gemini, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";
import { Sandbox } from 'e2b'
import getSandbox from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({step}) => {
    const sandboxId = await step.run("get-sandbox-id", async ()=> {
      try {
        const sandbox = await Sandbox.create('vibe-webbuilder-test');
        return sandbox.sandboxId;
      } catch (error) {
        console.error('Failed to create sandbox:', error);
        throw new Error('Sandbox creation failed');
      }
    })
    
    const summarizer = createAgent({
      name: "code-agent",
      system: "You are an expert Next.js developer. Always provide complete, working code snippets without asking questions. Create practical React components with TypeScript, proper styling, and clear comments.",
      model: gemini({
        model: "gemini-2.0-flash-exp",
      }),
    });

    const prompt = "Create a responsive product card component with image, title, price, and add to cart button using TypeScript and Tailwind CSS";
    const result = await summarizer.run(prompt);

    const sandboxURL = await step.run("get-sandbox-url", async ()=>{
      const sandbox = await getSandbox(sandboxId);
      const host =  sandbox.getHost(3000);
      return `https://${host}`
    })


    return { result, sandboxURL }
  }
);

