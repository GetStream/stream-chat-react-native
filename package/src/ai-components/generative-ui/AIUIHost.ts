import type { ReactNode } from 'react';
import { Linking } from 'react-native';

import { type AIUIAction, aiUIActionProblem } from './AIUIAction';
import type { AIUIComponent } from './AIUIComponent';
import { aiUIComponentDefinitionJSON } from './AIUIComponentDefinition';
import { type AIUIDocument, isSameAIUIDocument } from './AIUIDocument';
import { aiUILinkScheme } from './AIUIHelpers';
import { type AIUIEngine, type AIUIRenderer, aiUIRendererReads } from './AIUIRenderer';

import type { AIMessage } from '../conversation/types';
import type { AIToolCallPart } from '../message-parts/types';
import type { AIClientTool, AIClientToolDefinition } from '../tool-calls/AIClientToolRunner';

/**
 * Why one of the app's tools didn't run for a reply's UI, or failed, in words that name the tool.
 */
export class AIUIToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUIToolError';
  }
}

let toolRuns = 0;

export type AIUIHostOptions = {
  /** The renderer of each format the agent writes, the first one listed asked first. */
  renderers: AIUIRenderer[];
  /**
   * Sends what the person did to the agent, as their next message, such as
   * `session.responses.create(action.label, { uiAction: aiUIActionJSON(action) })`.
   */
  send: (action: AIUIAction) => Promise<unknown> | unknown;
  /** The app's views the agent can place. */
  components?: AIUIComponent[];
  /** Tells the app that an action could not be sent. It is logged by default. */
  onError?: (error: unknown, action: AIUIAction) => void;
  /**
   * Tells the app that a reply's UI, or a part of it, failed to show: a reply's UI that throws
   * shows the reply's text instead, and one of the app's components that throws leaves only
   * itself out. It is logged by default.
   */
  onRenderError?: (error: unknown, messageId: string) => void;
  /**
   * Opens a link from a reply's UI. By default, web and email links open and others don't: the
   * agent writes the links, so another could call someone or act in another app.
   */
  open?: (url: string) => void;
  /**
   * The app's tools a reply's UI can run, the same ones an `AIClientToolRunner` takes. A tool
   * whose definition doesn't say it is read-only (`annotations.readOnlyHint`) runs only when the
   * person asks for it, such as with a tap, never by itself as a reply shows.
   */
  tools?: AIClientTool[];
};

const WEB_OR_EMAIL = new Set(['http', 'https', 'mailto']);

/**
 * Whether a link is one a reply's UI may open by default: a web link with a host, or an email
 * link.
 */
export const isWebOrEmailLink = (url: string) => {
  const scheme = aiUILinkScheme(url);
  return scheme !== undefined && WEB_OR_EMAIL.has(scheme);
};

const openWebOrEmailLink = (url: string) => {
  if (!isWebOrEmailLink(url)) {
    console.warn(`A reply's UI asked to open ${url}, which isn't a web or email link`);
    return;
  }
  Linking.openURL(url.trim()).catch(() => undefined);
};

/**
 * The generated UI of one conversation: the renderers of the formats the agent writes, the
 * app's components and tools, what each reply's UI was left in, and where what the person does
 * goes. Give it to `AIConversation` as `ui`; keep one per conversation, for as long as it shows.
 */
export class AIUIHost {
  readonly components: AIUIComponent[];
  readonly renderers: AIUIRenderer[];

  private readonly engines = new Map<AIUIRenderer, AIUIEngine>();
  private readonly failed = new Set<string>();
  private lastSend: Promise<void> = Promise.resolve();
  private readonly listeners = new Set<() => void>();
  private readonly options: AIUIHostOptions;
  private readonly received = new Map<string, AIUIDocument>();
  private readonly states = new Map<string, unknown>();
  private readonly tools: Map<string, AIClientTool>;
  private refreshing = false;
  private version = 0;

  constructor(options: AIUIHostOptions) {
    this.options = options;
    this.renderers = options.renderers;
    this.components = options.components ?? [];
    this.tools = new Map();
    for (const tool of options.tools ?? []) {
      if (!this.tools.has(tool.definition.name)) this.tools.set(tool.definition.name, tool);
    }
  }

  /** The names of the app's tools a reply's UI can run with `runTool`, sorted. */
  get toolNames() {
    return [...this.tools.keys()].sort();
  }

  /** The app's tools a reply's UI can run, as the agent is told them, sorted by name. */
  get toolDefinitions(): AIClientToolDefinition[] {
    return this.toolNames.map((name) => this.tools.get(name)!.definition);
  }

  /** The app's component the agent places by `name`. */
  component(name: string) {
    return this.components.find((component) => component.definition.name === name);
  }

  /**
   * Whether one of its renderers reads `document`. The one that does can still show nothing of
   * its own for a reply, which then shows its text, as `content` tells.
   */
  canShow(document: AIUIDocument) {
    return this.renderers.some((renderer) => aiUIRendererReads(renderer, document));
  }

  /**
   * The view of a reply's document from the first renderer that reads its format and version,
   * or `null` when none shows anything of its own, so the reply shows its text. `AIUIView` puts
   * it on screen; `AIConversation` does it for every reply.
   */
  content(document: AIUIDocument, messageId: string): ReactNode | null {
    if (this.failed.has(messageId)) return null;
    const renderer = this.renderers.find((candidate) => aiUIRendererReads(candidate, document));
    return renderer ? (this.engineOf(renderer).view(document, messageId) ?? null) : null;
  }

  /**
   * Gives its renderers the UI of the conversation's replies, oldest first, as each arrives or
   * changes, whether or not the reply is on screen, so a format whose later replies change an
   * earlier one's UI follows them all. It also tells them when a reply leaves the conversation,
   * or its UI does, such as when it is deleted. `AIConversation` does it: call it with the
   * conversation's messages when you show replies yourself with `AIUIView`.
   */
  receive(messages: AIMessage[]) {
    const documents = new Map<string, AIUIDocument>();
    for (const message of messages) {
      if (message.role !== 'user' && message.uiDocument) {
        documents.set(message.id, message.uiDocument);
      }
    }
    const left: [string, AIUIDocument][] = [];
    for (const [messageId, document] of [...this.received]) {
      if (documents.has(messageId)) continue;
      this.received.delete(messageId);
      left.push([messageId, document]);
    }
    for (const [messageId, document] of documents) {
      const before = this.received.get(messageId);
      if (isSameAIUIDocument(before, document)) continue;
      this.received.set(messageId, document);
      // A reply whose UI failed while it was written gets one more try once it is written.
      if (before && !document.isStreaming) this.failed.delete(messageId);
      const renderer = this.renderers.find((candidate) => aiUIRendererReads(candidate, document));
      if (renderer) this.engineOf(renderer).receive?.(document, messageId);
    }
    // Forgets the replies that left once the conversation has rendered without them, since
    // this runs while it renders, and a render React throws away must not lose what a reply
    // was left in.
    if (left.length) {
      queueMicrotask(() => {
        for (const [messageId, document] of left) {
          if (this.received.has(messageId)) continue;
          this.states.delete(messageId);
          this.failed.delete(messageId);
          const renderer = this.renderers.find((candidate) =>
            aiUIRendererReads(candidate, document),
          );
          if (renderer) this.engineOf(renderer).remove?.(messageId);
        }
      });
    }
  }

  /**
   * Sends what the person did to the agent, after everything sent before it, so the agent gets
   * a reply's actions in the order they happened. Resolves to whether it was sent: one the
   * agent's backend would refuse, or that fails to send, goes to `onError`, resolves to
   * `false`, and does not hold up the ones after it.
   */
  send(action: AIUIAction): Promise<boolean> {
    const report = (error: unknown) => {
      if (this.options.onError) this.options.onError(error, action);
      else console.error("Couldn't send what the person did in a reply's UI", error);
    };
    const problem = aiUIActionProblem(action);
    if (problem) {
      report(new Error(problem));
      return Promise.resolve(false);
    }
    const sent = this.lastSend.then(async () => {
      try {
        await this.options.send(action);
        return true;
      } catch (error) {
        report(error);
        return false;
      }
    });
    this.lastSend = sent.then(() => undefined);
    return sent;
  }

  /**
   * Shows a reply's text in place of its UI, which failed to show, and tells the app. It lasts
   * while the reply is in the conversation, or, for a reply still being written, until it is
   * written. `AIConversation` and `AIUIView` do it.
   */
  fail(messageId: string, error: unknown) {
    if (this.failed.has(messageId)) return;
    this.failed.add(messageId);
    if (this.options.onRenderError) this.options.onRenderError(error, messageId);
    else console.error(`A reply's UI failed to show, so its text shows instead`, error);
    this.refresh();
  }

  /**
   * Tells the app that a part of a reply's UI failed to show, such as one of the app's
   * components that threw, while the rest of it still shows. `AIUIComponentView` calls it.
   */
  reportRenderError(error: unknown, messageId: string) {
    if (this.options.onRenderError) this.options.onRenderError(error, messageId);
    else console.error(`A part of a reply's UI failed to show, so it is left out`, error);
  }

  /**
   * Has the conversation show its replies again, because what one of them shows changed since
   * it was last asked, such as a finished reply that turned out to show nothing of its own.
   * Renderers call it; the conversation shows them again after the current render, however many
   * times it is called in it.
   */
  refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    queueMicrotask(() => {
      this.refreshing = false;
      this.version++;
      this.listeners.forEach((listener) => listener());
    });
  }

  /** Calls `listener` each time the conversation should show its replies again. */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** A number that changes each time the conversation should show its replies again. */
  getVersion = () => this.version;

  /**
   * Runs one of the app's tools for a reply's UI, such as to load data on this device, and
   * resolves to its output. A tool that isn't read-only runs only when `userInitiated`, from
   * something the person did. Rejects with an `AIUIToolError` when the tool can't run here, fails,
   * or gives output that isn't JSON.
   */
  async runTool(
    name: string,
    args: Record<string, unknown> = {},
    { userInitiated = false }: { userInitiated?: boolean } = {},
  ): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new AIUIToolError(`No tool named ${name}`);
    if (!userInitiated && tool.definition.annotations?.readOnlyHint !== true) {
      throw new AIUIToolError(
        `${name} isn't read-only, so it runs only when the person asks for it`,
      );
    }
    const call: AIToolCallPart = {
      arguments: args,
      executor: 'client',
      id: `ui-${name}-${++toolRuns}`,
      name,
      status: 'awaiting_client',
    };
    let result;
    try {
      result = await tool.run(call);
    } catch (error) {
      throw new AIUIToolError(
        `${name} failed${error instanceof Error && error.message ? `: ${error.message}` : ''}`,
      );
    }
    if (result.failure !== undefined) throw new AIUIToolError(result.failure);
    if (result.output === undefined) return undefined;
    try {
      const json = JSON.stringify(result.output);
      if (json !== undefined) return JSON.parse(json) as unknown;
    } catch {
      // Not JSON, such as a value that refers to itself.
    }
    throw new AIUIToolError(`${name} gave output that isn't JSON`);
  }

  /** Opens a link from a reply's UI, as the host's `open` allows. */
  open(url: string) {
    if (aiUILinkScheme(url) === undefined) {
      console.warn(`A reply's UI asked to open ${url}, which isn't a link`);
      return;
    }
    (this.options.open ?? openWebOrEmailLink)(url.trim());
  }

  /** The state a reply's UI was left in, such as a form's values, kept while the host is. */
  state(messageId: string): unknown {
    return this.states.get(messageId);
  }

  /** Keeps the state a reply's UI was left in. `undefined` forgets it. */
  setState(messageId: string, state: unknown) {
    if (state === undefined) this.states.delete(messageId);
    else this.states.set(messageId, state);
  }

  /**
   * What the agent's backend needs to write UI this app shows: each format it reads, with what
   * its renderer adds, such as the model's instructions, and the app's components and tools.
   */
  async capabilities() {
    return {
      components: this.components.map(({ definition }) => aiUIComponentDefinitionJSON(definition)),
      // The app's tools as Model Context Protocol tools.
      tools: this.toolDefinitions,
      renderers: await Promise.all(
        this.renderers.map(async (renderer) => ({
          ...(await renderer.capabilities?.(this.components, this.toolDefinitions)),
          format: renderer.format,
        })),
      ),
      v: 1,
    };
  }

  // The engine of a renderer, made the first time it is needed and kept as the host is.
  private engineOf(renderer: AIUIRenderer) {
    let engine = this.engines.get(renderer);
    if (!engine) {
      engine = renderer.createEngine(this);
      this.engines.set(renderer, engine);
    }
    return engine;
  }
}
