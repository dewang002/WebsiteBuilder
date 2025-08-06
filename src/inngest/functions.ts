import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";

import { inngest } from "@/src/inngest/client";
import { Sandbox } from 'e2b';
import { PROMPT } from "@/src/prompt";

import { getSandbox, lastAssitantTextMessageContent } from "@/src/inngest/utils";
import z from "zod";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
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
      description: "Am exper coding agent",
      system: PROMPT,
      model: gemini({
        model: "gemini-2.0-flash-exp",
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run('teminal', async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data
                  }
                });
                return result.stdout
              } catch (e) {
                console.error(`Command failed:${e}...`)
                return console.error(`Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`)
              }
            })
          }
        }),
        createTool({
          name: "createOrUpdateFile",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string()
              }),
            )
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("creteOrUpdate", async () => {
              try {
                const updateFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updateFiles[file.path] = file.content;
                }
                return updateFiles;
              } catch (e) {
                return "error" + e
              }
            })
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles
            }
          }
        }),
        createTool({
          name: "readFiles",
          description: "",
          parameters: z.object({
            files: z.array(z.string())
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId)
                const contents = []
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content })
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error" + e
              }
            })
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessage = lastAssitantTextMessageContent(result)

          if (lastAssistantTextMessage && network) {
            if (lastAssistantTextMessage.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessage
            }
          }
          return result
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [summarizer],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return summarizer;
      }
    })

    // const prompt = "Create a responsive product card component with image, title, price, and add to cart button using TypeScript and Tailwind CSS";
    const result = await network.run(event.data?.email);

    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`
    })

    
    const files = result?.state?.data?.files || {};
    const summary = result?.state?.data?.summary || "";
    return {
      url: sandboxURL,
      title: "Fragment",
      files,
      summary
    }
  }
);

