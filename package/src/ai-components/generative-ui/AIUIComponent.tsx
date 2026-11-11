import React, { type ComponentType, useMemo } from 'react';

import { decodeAIUIArguments } from './AIUIArguments';
import type { AIUIComponentDefinition } from './AIUIComponentDefinition';
import { AIUIEntrance } from './AIUIEntrance';
import { AIUIErrorBoundary } from './AIUIErrorBoundary';
import type { AIUIHost } from './AIUIHost';

/** Where an app's component is shown, and how it tells the agent what the person did. */
export type AIUIComponentContext = {
  /**
   * Tells the agent about one of the component's events, as the person's next message.
   * `label` is what the person did, in their words, such as "Tell me more about St. Naum".
   */
  emit: (event: string, label: string, payload?: Record<string, unknown>) => void;
  /** The conversation's host, for running the app's tools and opening links. */
  host: AIUIHost;
  /** Whether the agent is still writing the reply's UI, so the arguments may still change. */
  isStreaming: boolean;
  /** The reply the component is in. */
  messageId: string;
};

export type AIUIComponentProps<Arguments> = {
  /** What the agent filled in: keys in camelCase, dates as `Date`s. */
  args: Arguments;
  context: AIUIComponentContext;
};

/**
 * One of the app's views that the agent can place in a reply's UI, in whichever format it
 * writes, such as a map or a card over the app's own data. The counterpart of `AIUIComponent`
 * in StreamChatAI.
 */
export type AIUIComponent = {
  Component: ComponentType<AIUIComponentProps<never>>;
  /** Its description, the same on every platform and for the agent. */
  definition: AIUIComponentDefinition;
};

/**
 * One of the app's components, with what its view reads from the agent's arguments. The view
 * gets them only once they fit the definition's parameters, so it can rely on their types.
 */
export const defineAIUIComponent = <Arguments,>(
  definition: AIUIComponentDefinition,
  Component: ComponentType<AIUIComponentProps<Arguments>>,
): AIUIComponent => ({
  // The arguments are checked against `definition` before the view gets them.
  Component: Component as unknown as ComponentType<AIUIComponentProps<never>>,
  definition,
});

// What an app's component was given, to try it again once that changes or the reply is written.
const attemptOf = (args: Record<string, unknown>, isStreaming: boolean) => {
  try {
    return `${isStreaming}\u0000${JSON.stringify(args)}`;
  } catch {
    return args;
  }
};

/**
 * An app's component for the arguments the agent wrote, coming in as it shows, or nothing
 * while they don't fit its parameters, such as while they are still streaming in. Renderers
 * place the app's components with it. One that throws leaves only itself out of the reply's
 * UI, is tried again when its arguments change, and is reported once the reply is written.
 */
export const AIUIComponentView = ({
  args,
  component,
  context,
}: {
  args: Record<string, unknown>;
  component: AIUIComponent;
  context: AIUIComponentContext;
}) => {
  const { host, isStreaming, messageId } = context;
  // Worked out again only when the arguments change, for a renderer that keeps the same object
  // while they don't, as the A2UI renderer does.
  const decoded = useMemo(
    () => decodeAIUIArguments(args, component.definition.parameters),
    [args, component],
  );
  const resetKey = useMemo(
    () => (decoded === undefined ? undefined : attemptOf(decoded, isStreaming)),
    [decoded, isStreaming],
  );
  if (decoded === undefined) return null;
  const { Component } = component;
  return (
    <AIUIErrorBoundary
      onError={(error) => {
        // While the reply streams, what the component was given may still be incomplete.
        if (!isStreaming) host.reportRenderError(error, messageId);
      }}
      resetKey={resetKey}
    >
      <AIUIEntrance>
        <Component args={decoded as never} context={context} />
      </AIUIEntrance>
    </AIUIErrorBoundary>
  );
};
