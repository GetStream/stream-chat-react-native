import React, { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  type ActionPayload,
  type Catalog,
  type ComponentApi,
  MessageProcessor,
  type SurfaceModel,
} from '@a2ui/web_core';

import { A2UIEngineContext, A2UIReplyContext } from './A2UIContexts';
import { A2UIPlaceholder } from './A2UIPlaceholder';
import {
  A2UI_VERSION,
  a2uiMessagesIn,
  a2uiSourceOf,
  normalizeA2UIMessage,
  supportsA2UIVersion,
} from './A2UIStream';
import { A2UISurfaceView } from './A2UISurface';
import { A2UI_DEFAULT_CATALOG_ID, a2uiTypeName } from './catalogDocument';
import { a2uiCatalogsOf } from './catalogs';
import { A2UI_BASIC_COMPONENTS } from './components/basicComponents';
import type { A2UIComponents, A2UIIcons } from './components/types';
import { a2uiInstructions } from './instructions';
import {
  secretContextKeysOf,
  secretPathsOf,
  secretValuesOf,
  withoutPaths,
  withoutSecrets,
} from './secrets';

import { useTheme } from '../ai-components/contexts';
import type { AIUIDocument } from '../ai-components/generative-ui/AIUIDocument';
import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';
import type { AIUIHost } from '../ai-components/generative-ui/AIUIHost';
import {
  aiUIMediaSource,
  type AIUIMediaURL,
  aiUIPublicMediaURL,
} from '../ai-components/generative-ui/AIUIMedia';
import type { AIUIEngine, AIUIRenderer } from '../ai-components/generative-ui/AIUIRenderer';
import { primitives } from '../ai-components/internal/tokens';

export { A2UI_DEFAULT_CATALOG_ID };

/** What went wrong in a reply's A2UI, as the A2UI specification reports it to an agent. */
export type A2UIError = {
  /** A code such as `VALIDATION_FAILED` or `EXPRESSION_ERROR`. */
  code: string;
  message: string;
  /** Where in the message it went wrong, as a JSON pointer. */
  path?: string;
  surfaceId?: string;
};

export type A2UIRendererOptions = {
  /**
   * The id the agent names the catalog with the app's components by. A surface naming the
   * basic catalog shows them too, and a surface naming none is made with this one.
   */
  catalogId?: string;
  /**
   * The views of the basic catalog's components to use instead of the default ones, by their
   * A2UI type, such as `{ Card: MyCard }`. Each gets what the agent wrote for it, resolved.
   */
  components?: A2UIComponents;
  /**
   * The app's icons for the names A2UI's Icon takes, such as `{ shoppingCart: MyCartIcon }`, over
   * the Material icons it draws by default. An app's own names work too, when its agent is told
   * them.
   */
  icons?: A2UIIcons;
  /**
   * What the app tells the model before A2UI's own instructions in `capabilities`, such as which
   * answers to write as UI.
   */
  instructions?: string;
  /** The locale numbers and dates are formatted in. `en-US` by default. */
  locale?: string;
  /**
   * Decides what an Image, Video or AudioPlayer loads for the link the agent wrote: the address
   * to load, or `null` not to load it. By default only public web links load, never addresses on
   * the person's network, such as `192.168.1.1` or `localhost`.
   */
  mediaUrl?: AIUIMediaURL;
  /**
   * The basic catalog's components and functions this renderer leaves out, such as `['Video']`.
   * The agent's instructions leave them out too, and a reply that places one shows the rest.
   */
  removing?: string[];
  /**
   * Tells the app what went wrong in a reply's A2UI, such as a message that isn't JSON or a
   * component the catalog doesn't have, with the reply's id. The rest of the reply's UI still
   * shows. What is wrong with the renderer rather than a reply, such as an app's component that
   * can't join the catalog, comes without an id. Logged by default.
   */
  onError?: (error: A2UIError, messageId?: string) => void;
};

const reportA2UIError = (options: A2UIRendererOptions, error: A2UIError, messageId?: string) => {
  if (options.onError) options.onError(error, messageId);
  else console.error(`A reply's A2UI can't show: ${error.code} ${error.message}`, error);
};

type RendererError = {
  code?: unknown;
  message?: unknown;
  path?: unknown;
  surfaceId?: unknown;
};

const errorOf = (error: RendererError): A2UIError => ({
  code: typeof error.code === 'string' ? error.code : 'EXECUTION_ERROR',
  message: typeof error.message === 'string' ? error.message : String(error.message),
  ...(typeof error.path === 'string' ? { path: error.path } : {}),
  ...(typeof error.surfaceId === 'string' ? { surfaceId: error.surfaceId } : {}),
});

// An action's name in words, such as `Submit form` for `submit_form`, for an action whose button
// says nothing.
const wordsOf = (name: string) => {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
};

/**
 * The surfaces of one reply: its own processor, fed the messages of its document as they
 * complete. Messages that changed, rather than grew, start its surfaces again.
 */
export class A2UIReplyState {
  isStreaming = false;

  private applied: string[] = [];
  private readonly engine: A2UIEngine;
  private listeners = new Set<() => void>();
  private readonly messageId: string;
  private processor: MessageProcessor<ComponentApi>;
  private reported = new Set<string>();
  private shown: SurfaceModel<ComponentApi>[] = [];
  private showedNothing = false;
  private stopWatching: () => void;

  constructor(engine: A2UIEngine, messageId: string) {
    this.engine = engine;
    this.messageId = messageId;
    this.processor = this.makeProcessor();
    this.stopWatching = this.watch();
  }

  /** The reply's surfaces, in the order the agent made them. */
  surfaces = (): SurfaceModel<ComponentApi>[] => this.shown;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Applies the messages of `source` not applied yet. */
  update(source: string, isStreaming: boolean) {
    this.isStreaming = isStreaming;
    const messages = a2uiMessagesIn(source);
    const grew =
      messages.length >= this.applied.length &&
      this.applied.every((message, index) => messages[index] === message);
    if (!grew) {
      this.stopWatching();
      this.processor.dispose();
      this.processor = this.makeProcessor();
      this.stopWatching = this.watch();
      this.applied = [];
    }
    for (const raw of messages.slice(this.applied.length)) {
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        json = undefined;
      }
      if (!isRecord(json)) {
        this.report({ code: 'VALIDATION_FAILED', message: 'A message isn’t a JSON object' });
        continue;
      }
      this.feed(normalizeA2UIMessage(json, this.engine.catalogId));
    }
    this.applied = messages;
    this.refresh();
    // A finished reply that made no surface shows its text, which the host shows when asked
    // again: it asked before these messages were applied.
    const showsNothing = !isStreaming && this.shown.length === 0;
    if (showsNothing !== this.showedNothing) {
      this.showedNothing = showsNothing;
      this.engine.host.refresh();
    }
  }

  dispose() {
    this.stopWatching();
    this.processor.dispose();
    this.listeners.clear();
  }

  // Feeds a message to the processor. A batch of components that one bad component spoils is
  // fed again a component at a time, so the rest show, as they would while being written.
  private feed(message: Record<string, unknown>) {
    const errors = this.processor.processMessagesWithErrors(message as never);
    const reported = errors.length ? (this.oneAtATime(message) ?? errors) : errors;
    for (const { error } of reported) this.report(errorOf(error as RendererError));
  }

  // The components of a message one at a time, with what goes wrong with each, or `undefined`
  // when the message has no batch of them to feed again. A surface made with components is made
  // before they are added, and stays when they fail, so they are added to it.
  private oneAtATime(message: Record<string, unknown>) {
    const { createSurface, updateComponents } = message;
    const batch = isRecord(updateComponents)
      ? updateComponents
      : isRecord(createSurface)
        ? createSurface
        : undefined;
    if (!batch || !Array.isArray(batch.components) || batch.components.length < 2) {
      return undefined;
    }
    const { surfaceId } = batch;
    if (
      batch === createSurface &&
      (typeof surfaceId !== 'string' || !this.processor.model.getSurface(surfaceId))
    ) {
      return undefined;
    }
    return batch.components.flatMap((component: unknown) =>
      this.processor.processMessagesWithErrors({
        updateComponents: { components: [component], surfaceId },
        version: message.version,
      } as never),
    );
  }

  private makeProcessor() {
    return new MessageProcessor<ComponentApi>(this.engine.catalogs(), (action) => this.act(action));
  }

  // Tells the agent what the person did, in the words of the button they tapped, else its name.
  // Never in the words the agent gave the action, which could say something the button doesn't;
  // those go along as `userMessage`. What the person typed into an obscured field goes nowhere:
  // not in the context, the message or the data model, which goes when the surface asks for it.
  private act(action: ActionPayload) {
    const surface = this.processor.model.getSurface(action.surfaceId);
    const paths = secretPathsOf(surface);
    const secrets = secretValuesOf(surface);
    const context = withoutSecrets(action.context ?? {}, secrets) as Record<string, unknown>;
    for (const key of secretContextKeysOf(surface, action.sourceComponentId)) delete context[key];
    const userMessage =
      typeof action.userMessage === 'string'
        ? withoutSecrets(action.userMessage, secrets).trim()
        : '';
    const dataModel = surface?.sendDataModel
      ? withoutSecrets(withoutPaths(surface.dataModel.get('/'), paths), secrets)
      : undefined;
    void this.engine.host.send({
      format: 'a2ui',
      label: this.buttonText(action) ?? wordsOf(action.name),
      messageId: this.messageId,
      name: action.name,
      payload: {
        context,
        sourceComponentId: action.sourceComponentId,
        surfaceId: action.surfaceId,
        ...(userMessage ? { userMessage } : {}),
        ...(dataModel !== undefined ? { dataModel } : {}),
      },
    });
  }

  // What the tapped button says: its child Text, written out or bound to the data model.
  private buttonText(action: ActionPayload) {
    const surface = this.processor.model.getSurface(action.surfaceId);
    const components = surface?.componentsModel;
    const child: unknown = components?.get(action.sourceComponentId)?.properties.child;
    if (typeof child !== 'string') return undefined;
    const text: unknown = components?.get(child)?.properties.text;
    if (typeof text === 'string') return text.trim() === '' ? undefined : text;
    if (isRecord(text) && typeof text['@path'] === 'string' && text['@path'].startsWith('/')) {
      const bound: unknown = surface?.dataModel.get(text['@path']);
      return typeof bound === 'string' && bound.trim() !== '' ? bound : undefined;
    }
    return undefined;
  }

  private watch() {
    const subscriptions = [
      this.processor.onSurfaceCreated(() => this.refresh()),
      this.processor.onSurfaceDeleted(() => this.refresh()),
      this.processor.model.onError.subscribe((error) =>
        this.report(errorOf(error as RendererError)),
      ),
    ];
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private refresh() {
    const surfaces = [...this.processor.getSurfaces().values()];
    if (
      surfaces.length === this.shown.length &&
      surfaces.every((surface, index) => surface === this.shown[index])
    ) {
      return;
    }
    this.shown = surfaces;
    this.listeners.forEach((listener) => listener());
  }

  // Each error once: a reply's messages are fed again as it streams, and the processor tells
  // the same error both as it fails a message, with the place in it, and to the surface.
  private report(error: A2UIError) {
    const key = [error.code, error.message, error.surfaceId].join('\u0000');
    if (this.reported.has(key)) return;
    this.reported.add(key);
    this.engine.report(error, this.messageId);
  }
}

/** A reply's surfaces, following its document as the agent writes it. */
const A2UIReplyContent = ({
  document,
  engine,
  messageId,
}: {
  document: AIUIDocument;
  engine: A2UIEngine;
  messageId: string;
}) => {
  const reply = engine.replyOf(document, messageId);
  const source = a2uiSourceOf(document) ?? '';
  const { isStreaming } = document;
  useLayoutEffect(() => {
    reply.update(source, isStreaming);
  }, [isStreaming, reply, source]);
  const surfaces = useSyncExternalStore(reply.subscribe, reply.surfaces);
  const { theme } = useTheme();
  const replyContext = useMemo(() => ({ isStreaming, messageId }), [isStreaming, messageId]);
  if (surfaces.length === 0) return isStreaming ? <A2UIPlaceholder /> : null;
  return (
    <A2UIEngineContext.Provider value={engine}>
      <A2UIReplyContext.Provider value={replyContext}>
        <View style={[styles.surfaces, theme.a2ui?.surfaces]}>
          {surfaces.map((surface) => (
            <A2UISurfaceView key={surface.id} surface={surface} />
          ))}
        </View>
      </A2UIReplyContext.Provider>
    </A2UIEngineContext.Provider>
  );
};

/**
 * Shows the A2UI of one conversation. Each reply's surfaces are its own, kept for as long as
 * the host keeps the engine, so what the person entered survives scrolling.
 */
export class A2UIEngine implements AIUIEngine {
  readonly catalogId: string;
  readonly components: A2UIComponents;
  readonly host: AIUIHost;
  readonly icons: A2UIIcons;
  readonly mediaUrl: AIUIMediaURL;
  /** Each reply's surfaces, by the reply's id. */
  readonly replies = new Map<string, A2UIReplyState>();

  private made?: Catalog<ComponentApi>[];
  private readonly options: A2UIRendererOptions;

  constructor(host: AIUIHost, options: A2UIRendererOptions) {
    this.host = host;
    this.options = options;
    this.catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
    // The basic catalog's views, the app's own over them.
    this.components = { ...A2UI_BASIC_COMPONENTS, ...options.components };
    this.icons = options.icons ?? {};
    this.mediaUrl = options.mediaUrl ?? aiUIPublicMediaURL;
  }

  /** The address an Image, Video or AudioPlayer loads for a link the agent wrote, if any. */
  mediaSource(value: unknown) {
    return aiUIMediaSource(value, this.mediaUrl);
  }

  /** The catalogs a reply's surfaces are made with, made once. */
  catalogs(): Catalog<ComponentApi>[] {
    this.made ??= a2uiCatalogsOf({
      catalogId: this.catalogId,
      components: this.host.components,
      locale: this.options.locale,
      removing: this.options.removing,
      onComponentError: (component, error) =>
        this.report({
          code: 'CATALOG_ERROR',
          message: `The component ${component.definition.name} can't join the catalog: ${String(error)}`,
        }),
      onToolError: (tool, error) =>
        this.report({
          code: 'CATALOG_ERROR',
          message: `The tool ${tool.name} can't join the catalog: ${String(error)}`,
        }),
      openUrl: (url) => this.host.open(url),
      runTool: (name, args, options) => this.host.runTool(name, args, options),
      tools: this.host.toolDefinitions,
    });
    return this.made;
  }

  /** The app's component the agent places by its A2UI type, such as `PlaceCard`. */
  appComponent(type: string) {
    return this.host.components.find(
      (component) => a2uiTypeName(component.definition.name) === type,
    );
  }

  /**
   * Tells the app what went wrong, after the current render: a reply's messages are applied
   * as it first shows, and an app may set state when told.
   */
  report(error: A2UIError, messageId?: string) {
    queueMicrotask(() => reportA2UIError(this.options, error, messageId));
  }

  /** The surfaces of a reply, made with its messages so far the first time they are asked for. */
  replyOf(document: AIUIDocument, messageId: string) {
    let reply = this.replies.get(messageId);
    if (!reply) {
      reply = new A2UIReplyState(this, messageId);
      this.replies.set(messageId, reply);
      reply.update(a2uiSourceOf(document) ?? '', document.isStreaming);
    }
    return reply;
  }

  remove(messageId: string) {
    this.replies.get(messageId)?.dispose();
    this.replies.delete(messageId);
  }

  view(document: AIUIDocument, messageId: string) {
    if (a2uiSourceOf(document) === undefined) return null;
    // A finished reply whose A2UI made no surface shows its text instead, once that is known.
    if (!document.isStreaming && this.replyOf(document, messageId).surfaces().length === 0) {
      return null;
    }
    return <A2UIReplyContent document={document} engine={this} messageId={messageId} />;
  }
}

/**
 * The renderer of [A2UI](https://a2ui.org) 1.0 for `AIUIHost`, on the A2UI core
 * (`@a2ui/web_core`), with the basic catalog's components drawn natively. The app's components
 * join its catalog, so the agent places them like the basic catalog's own. The counterpart of
 * `A2UIRenderer` in StreamChatA2UI.
 */
export const createA2UIRenderer = (options: A2UIRendererOptions = {}): AIUIRenderer => {
  const catalogId = options.catalogId ?? A2UI_DEFAULT_CATALOG_ID;
  return {
    // The fence, the catalog and the instructions for both, so the agent's backend has its model
    // write UI this renderer shows. Without the instructions, when they can't be written, the rest
    // still goes.
    capabilities: async (components, tools) => {
      const fence = `ui:a2ui@${A2UI_VERSION}`;
      let instructions: string | undefined;
      try {
        instructions = await a2uiInstructions({
          catalogId,
          components,
          fence,
          ...(options.instructions?.trim() ? { preamble: options.instructions.trim() } : {}),
          removing: options.removing,
          tools,
        });
      } catch (error) {
        reportA2UIError(options, {
          code: 'EXECUTION_ERROR',
          message: `The A2UI instructions couldn't be written: ${String(error)}`,
        });
      }
      return {
        catalog_id: catalogId,
        fence,
        ...(instructions === undefined ? {} : { instructions }),
      };
    },
    createEngine: (host) => new A2UIEngine(host, options),
    format: 'a2ui',
    supports: supportsA2UIVersion,
  };
};

const styles = StyleSheet.create({
  surfaces: { gap: primitives.spacingSm },
});
