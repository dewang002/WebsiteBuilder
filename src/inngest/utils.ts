import Sandbox from '@e2b/code-interpreter'
import { AgentResult, TextMessage } from '@inngest/agent-kit'

export const getSandbox = async (sandboxId: string) => {
    const sandbox = await Sandbox.connect(sandboxId)
    return sandbox
  
}


export const lastAssistantTextMessageContent = (result: AgentResult) => {
  if (!result.output || !Array.isArray(result.output)) return undefined;

  // Find last assistant message, not first (safer for real chats)
  const message = [...result.output].reverse().find(
    (msg) => msg.role === "assistant"
  ) as TextMessage | undefined;

  if (!message?.content) return undefined;

  if (typeof message.content === "string") return message.content;

  if (Array.isArray(message.content)) {
    return message.content.map((c) => c.text).join('');
  }

  return undefined;
}

