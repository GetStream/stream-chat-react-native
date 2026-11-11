import { isAwaitingClient } from '../message-parts/parseMessageParts';
import type { AIMessagePartData, AIToolCallPart } from '../message-parts/types';

/**
 * The name, description and argument schema of a client tool. It reads the same JSON as a Model
 * Context Protocol tool (`name`, `description`, `inputSchema` and the `readOnlyHint` of its
 * `annotations`), so a tool defined with the MCP SDK can be used as it is. The counterpart of
 * `AIClientToolDefinition` in StreamChatAI.
 */
export type AIClientToolDefinition = {
  /** The unique name of the tool. */
  name: string;
  /** Hints about how the tool behaves, as a Model Context Protocol tool's `annotations`. */
  annotations?: {
    /** Whether the tool only reads, and changes nothing. */
    readOnlyHint?: boolean;
  };
  /** A description of what the tool does, for the agent. */
  description?: string;
  /** The JSON schema of the tool's arguments. */
  inputSchema?: Record<string, unknown>;
};

/** What a device reports for a call. The counterpart of `AIClientToolResult`. */
export type AIClientToolResult = {
  /** Why the device could not run the call, such as "Location not shared". Shown on the step and told to the model. */
  failure?: string;
  /** The result for the model, a value that serializes to JSON. */
  output?: unknown;
  /**
   * A short outcome every channel member sees on the step, such as "Shared approximate location".
   * Keep the data itself out of it.
   */
  summary?: string;
};

/** A completed call, with its result for the model. */
export const completedToolResult = (output: unknown, summary?: string): AIClientToolResult => ({
  output,
  summary,
});

/** A call the device could not run. */
export const failedToolResult = (reason: string): AIClientToolResult => ({ failure: reason });

// `result` with output the agent can read: JSON, as it goes to the model. Other output, such as a
// value that refers to itself, is a failure rather than a result that can't be sent.
const jsonResultOf = (result: AIClientToolResult): AIClientToolResult => {
  if (result.output === undefined) return result;
  try {
    const json = JSON.stringify(result.output);
    if (json !== undefined) return { ...result, output: JSON.parse(json) as unknown };
  } catch {
    // Falls through to the failure.
  }
  return failedToolResult("The tool's output isn't JSON");
};

/**
 * A tool this device runs when an AI agent asks for it. Describe it to the agent with
 * `AIClientToolRunner`'s `registrations`. The agent writes each call on its reply as an
 * `ai_tool_call` step with `executor: client` and `status: awaiting_client`, addressed to one
 * person and one install, and an `AIClientToolRunner` on that install runs it. The counterpart
 * of `AIClientTool`.
 */
export type AIClientTool = {
  /** The tool's name, description and argument schema, as the agent sees them. */
  definition: AIClientToolDefinition;
  /**
   * Runs one call. A call whose tool asks the person first reaches the device only once they
   * allowed it. A tool that throws reports that it failed.
   */
  run: (call: AIToolCallPart) => AIClientToolResult | Promise<AIClientToolResult>;
  /** Guidance for the agent on when and how to use the tool, sent with its definition. */
  instructions?: string;
  /** Whether the app shows that the tool reaches outside the conversation while it runs. */
  showExternalSourcesIndicator?: boolean;
};

/** How a client tool is described to the agent, for your backend to register it. */
export type AIClientToolRegistration = {
  /** What the tool does: its description, or its instructions when it has none. */
  description: string;
  /** The unique name of the tool. This is how the agent identifies it. */
  name: string;
  /** Whether the app shows that the tool reaches outside the conversation while it runs. */
  showExternalSourcesIndicator: boolean;
  /** Guidance for the agent on when and how to use the tool. */
  instructions?: string;
  /** The JSON schema of the tool's arguments. */
  parameters?: Record<string, unknown>;
};

/** Hands a call's result to your backend. A rejection offers it again on a later `run`. */
export type AIClientToolSend = (call: AIToolCallPart, result: AIClientToolResult) => Promise<void>;

export type AIClientToolRunnerOptions = {
  /** This install, matched against a call's `target_client_id`, such as `AIClientIdentity.installId()`. */
  clientId: string;
  tools: AIClientTool[];
  /** The person signed in, matched against a call's `target_user_id`. */
  userId: string;
  /** How many times a result is offered to `send` before the runner gives up on it. Defaults to 3. */
  maxAttempts?: number;
};

type CallState = {
  attempts: number;
  result?: AIClientToolResult;
  sending: boolean;
  sent: boolean;
};

/**
 * Runs the client tool calls addressed to this device, each once. Give it each AI reply's steps
 * as they update. It runs a call when the call awaits this person and this install, the runner
 * has a tool of that name and the call has not run here before, then hands the result to `send`.
 * A result that could not be sent is sent again on a later update, without running the tool
 * again. The counterpart of `AIClientToolRunner` in StreamChatAI.
 *
 * ```ts
 * const runner = new AIClientToolRunner({ clientId: AIClientIdentity.installId(), tools: [localTime], userId });
 * runner.run(message.parts, (call, result) => backend.send(call.id, result));
 * ```
 */
export class AIClientToolRunner {
  readonly clientId: string;
  readonly maxAttempts: number;
  readonly userId: string;
  private readonly calls = new Map<string, CallState>();
  private readonly tools = new Map<string, AIClientTool>();

  constructor({ clientId, maxAttempts = 3, tools, userId }: AIClientToolRunnerOptions) {
    this.clientId = clientId;
    this.maxAttempts = maxAttempts;
    this.userId = userId;
    for (const tool of tools) {
      // The first tool of a name wins.
      if (!this.tools.has(tool.definition.name)) this.tools.set(tool.definition.name, tool);
    }
  }

  /** The names of the tools this device can run, sorted. */
  get toolNames() {
    return [...this.tools.keys()].sort();
  }

  /**
   * How this device's tools are described to the agent, sorted by name. Send them to your
   * backend so the agent knows it can call them.
   */
  get registrations(): AIClientToolRegistration[] {
    return this.toolNames.map((name) => {
      const { definition, instructions, showExternalSourcesIndicator } = this.tools.get(name)!;
      return {
        description: definition.description ?? instructions ?? '',
        name: definition.name,
        showExternalSourcesIndicator: showExternalSourcesIndicator ?? false,
        ...(instructions !== undefined ? { instructions } : {}),
        ...(definition.inputSchema !== undefined ? { parameters: definition.inputSchema } : {}),
      };
    });
  }

  /** Runs the calls among `parts` that await this device, and sends their results. */
  run(parts: readonly AIMessagePartData[], send: AIClientToolSend) {
    for (const { toolCall: call } of parts) {
      if (!call || !isAwaitingClient(call, this.userId, this.clientId)) continue;
      const tool = this.tools.get(call.name);
      if (!tool) continue;
      const state = this.calls.get(call.id) ?? { attempts: 0, sending: false, sent: false };
      if (state.sending || state.sent || state.attempts >= this.maxAttempts) continue;
      state.sending = true;
      this.calls.set(call.id, state);
      void this.deliver(tool, call, state, send);
    }
  }

  private async deliver(
    tool: AIClientTool,
    call: AIToolCallPart,
    state: CallState,
    send: AIClientToolSend,
  ) {
    if (!state.result) {
      try {
        state.result = jsonResultOf(await tool.run(call));
      } catch {
        // What the tool threw stays on the device: the failure is shown to everyone in the channel.
        state.result = failedToolResult("The tool couldn't run");
      }
    }
    state.attempts += 1;
    try {
      await send(call, state.result);
      state.sent = true;
    } catch {
      // Offered again on the next update that still shows the call waiting.
    }
    state.sending = false;
  }
}
