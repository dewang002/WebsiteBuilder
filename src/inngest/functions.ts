import { gemini, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";

import { inngest } from "@/src/inngest/client";
import { Sandbox } from 'e2b';
import { PROMPT } from "@/src/prompt";

import { getSandbox, lastAssistantTextMessageContent } from "@/src/inngest/utils";
import z from "zod";
import prisma from "../lib/db";

interface agent{
  summary: string
  files: {[path: string]: string}
}

export const codeAgent = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
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

    const summarizer = createAgent<agent>({
      name: "code-agent",
      description: "An exper coding agent",
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
            return await step?.run('terminal', async () => {              const buffers = { stdout: "", stderr: "" };

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
          handler: async ({ files }, { step, network }:Tool.Options<agent>) => {
            const newFiles = await step?.run("createOrUpdate", async () => {              try {
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
          const lastAssistantTextMessage = lastAssistantTextMessageContent(result)

          if (lastAssistantTextMessage && network) {
            if (lastAssistantTextMessage.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessage
            }
          }
          return result
        }
      }
    });

    const network = createNetwork<agent>({
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
    const result = await network.run(event.data?.content);

    const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0

    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`
    })

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "something went wrong! try again.",
            role: "ASSISTANT",
            type: "ERROR",          }
        })
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxURL,
              title: "Fragment",
              files: result.state.data.files
            }
          }
        }
      })
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

