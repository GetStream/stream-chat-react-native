import type { ReactNode } from 'react';

import type { AIUIComponent } from './AIUIComponent';
import type { AIUIDocument, AIUIFormat } from './AIUIDocument';
import type { AIUIHost } from './AIUIHost';

/**
 * Shows the documents of one conversation in a renderer's format. A host makes one per
 * renderer, the first time the renderer receives or shows something, and keeps it as long as
 * the host lives, so what a reply's UI holds, such as a form's values, survives scrolling. The
 * counterpart of `AIUIEngine` in StreamChatAI.
 */
export type AIUIEngine = {
  /**
   * The view of a reply's document, or `null` when it shows nothing of its own, such as a reply
   * that only changed an earlier one's UI, so the reply's text shows. It is called while the
   * conversation renders, so keep what it makes for a reply and return it again.
   */
  view: (document: AIUIDocument, messageId: string) => ReactNode | null;
  /**
   * Takes a reply's document as it arrives or changes, oldest reply first, whether or not the
   * reply is on screen, so a format whose later replies change an earlier one's UI can follow
   * them all. It comes while the conversation renders, before any reply's view is asked for:
   * change what is already on screen afterwards, such as in a microtask.
   */
  receive?: (document: AIUIDocument, messageId: string) => void;
  /**
   * Forgets a reply that left the conversation, or whose UI did, such as one that was deleted,
   * so the engine can let go of what it kept for it.
   */
  remove?: (messageId: string) => void;
};

/**
 * Reads one format of generated UI, such as A2UI. A plug-in of `AIUIHost`: the AI components
 * know no format themselves. The counterpart of `AIUIRenderer` in StreamChatAI.
 */
export type AIUIRenderer = {
  /** Makes what shows the documents of one conversation. */
  createEngine: (host: AIUIHost) => AIUIEngine;
  /** The format it reads. */
  format: AIUIFormat;
  /**
   * What the agent's backend needs to have its model write UI this renderer shows with
   * `components`, such as the model's instructions, which may take loading the format's
   * packages to write. None by default.
   */
  capabilities?: (
    components: AIUIComponent[],
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Whether it reads documents of `version`, or of no version. Every version by default. */
  supports?: (version: string | undefined) => boolean;
};

/** Whether `renderer` reads `document`: its format, in a version it supports. */
export const aiUIRendererReads = (renderer: AIUIRenderer, document: AIUIDocument) =>
  renderer.format === document.format && (renderer.supports?.(document.version) ?? true);
