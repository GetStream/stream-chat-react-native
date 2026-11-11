// What an agent is told to write A2UI with, and what checks it.
import { A2UI_VERSION } from './A2UIStream';

import type { AIUIComponent } from '../ai-components/generative-ui/AIUIComponent';
import type { AIUIComponentDefinition } from '../ai-components/generative-ui/AIUIComponentDefinition';
import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';
import type { AIClientToolDefinition } from '../ai-components/tool-calls/AIClientToolRunner';

/**
 * What an agent is told to write replies' UI in A2UI with: the basic catalog, or the part of it
 * `keep` names, with the app's components, and what the app adds.
 */
export type A2UIInstructionsConfig = {
  /** The id of the catalog with the app's components, as the renderer names it. */
  catalogId?: string;
  /** The app's components, or their portable definitions, such as a `UIComponents.json`. */
  components?: (AIUIComponent | AIUIComponentDefinition)[];
  /**
   * Replies with their UI, as the agent should write them. Each block must render with the
   * catalog, or no instructions are written: a broken example teaches the model broken UI.
   */
  examples?: string[];
  /** The info string of a reply's UI block, as the agents router reads it. */
  fence?: string;
  /** The basic catalog's components and functions to describe; all of them when absent. */
  keep?: string[];
  /**
   * The basic catalog's components and functions to leave out, such as those the app's renderer
   * leaves out with its own `removing`, after `keep`.
   */
  removing?: string[];
  /** Guidance on using the app's components. */
  notes?: string[];
  /** What the model is told first, such as which answers to write as UI. */
  preamble?: string;
  /** Rules added after the protocol's. */
  rules?: string[];
  /** The app's tools the agent can call from the UI it writes, as functions of the catalog. */
  tools?: AIClientToolDefinition[];
};

/** The A2UI an example holds that would not render, and why. */
export class A2UIInstructionsError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`An example's A2UI would not render:\n${problems.join('\n')}`);
    this.name = 'A2UIInstructionsError';
    this.problems = problems;
  }
}

/** A description of the A2UI v1.0 messages and the rules that keep what they make valid. */
export const A2UI_PROTOCOL_OVERVIEW = `# Generating user interfaces with A2UI v1.0

You render user interfaces by emitting A2UI messages. Every message is a JSON object with a \`"version": "1.0"\` field plus exactly one of these keys:

- \`createSurface\`: creates a surface. Requires \`surfaceId\`, and accepts \`catalogId\`, \`sendDataModel\`, \`components\` and \`dataModel\` so a complete UI can be sent in one message.
- \`updateComponents\`: adds or replaces components of an existing surface. Requires \`surfaceId\` and \`components\`.
- \`updateDataModel\`: writes to the surface data model. Requires \`surfaceId\` and \`value\`, and accepts a JSON Pointer \`path\`. Setting \`value\` to \`null\` deletes the entry at \`path\`.
- \`deleteSurface\`: removes a surface. Requires \`surfaceId\`.
- \`callRendererFunction\`: asks the renderer to run one of its functions.
- \`agentFunctionResponse\`: answers a \`callAgentFunction\` request from the renderer.

Rules:

1. Components are a flat adjacency list. Each component has a unique \`id\`, a \`component\` type, and its properties inline. Exactly one component must have the id \`root\`. An id is an identifier: letters, digits and underscores, not starting with a digit, such as \`saturday_plan\` (never \`saturday-plan\`).
2. Children are referenced by id, never nested inline. Use an array of ids, or \`{"componentId": "...", "path": "/items"}\` to repeat a template for every item of a data model list.
3. Any property may be a literal, a data binding \`{"@path": "/a/b"}\` or a function call \`{"@call": "name", "args": {...}}\`. Inside a list template, paths without a leading slash resolve relative to the current item, and \`{"@call": "@index"}\` returns the item's position. A literal object key that starts with \`@\` is written with \`@@\`, so \`"@@type"\` means \`"@type"\`.
4. Put content that changes in the data model and bind to it, so you can update values with \`updateDataModel\` instead of resending components.
5. Interactive components declare an \`action\`, which either dispatches an event to you (\`{"event": {"name": "...", "context": {...}}}\`) or runs a renderer function (\`{"functionCall": {"@call": "openUrl", "args": {"url": "..."}}}\`).
6. Surface ids must be unique for the lifetime of the renderer. Creating a surface that already exists is an error: delete it first, or send \`updateComponents\` and \`updateDataModel\` to change it.`;

export const writing = (fence: string, catalogId: string) => `## Writing UI in A2UI

Write a reply's UI in one fenced block whose info string is \`${fence}\`, after one short sentence saying what it shows, which is what people read wherever the UI can't show. In the block, write A2UI messages, one JSON object per line, and nothing else:

1. First a \`createSurface\` with a \`surfaceId\` new to this reply, the \`catalogId\` \`${catalogId}\`, and the \`dataModel\` the UI's inputs start from.
2. Then \`updateComponents\` messages for that surface with a few components each, \`root\` first, so the UI shows as you write it.

A reply's UI is shown as you wrote it: never write \`callRendererFunction\` or \`agentFunctionResponse\`, and never change an earlier reply's UI, but write a new one. What the person does in it comes back as their next message, which says what the button they tapped says. Give every event action a \`userMessage\` saying what it asks of you, such as "Update the plan", which comes back with it, and a \`context\` with what you need to know, bound to the data model.`;

// A JSON value with its object keys sorted, so the same catalog always reads the same.
export const sorted = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(sorted)
    : isRecord(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, sorted(value[key])]),
        )
      : value;

export const fenceOf = (fence?: string) => fence ?? `ui:a2ui@${A2UI_VERSION}`;

// The A2UI blocks of an example reply.
export const blocksIn = (example: string, fence: string) =>
  example
    .split(`\`\`\`${fence}\n`)
    .slice(1)
    .map((block) => block.split('\n```')[0]);
