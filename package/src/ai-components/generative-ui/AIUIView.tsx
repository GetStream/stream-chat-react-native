import React, { type ReactNode, useSyncExternalStore } from 'react';
import { StyleSheet } from 'react-native';

import type { AIUIDocument } from './AIUIDocument';
import { AIUIEntranceStage } from './AIUIEntrance';
import { AIUIErrorBoundary } from './AIUIErrorBoundary';
import type { AIUIHost } from './AIUIHost';

import { useTheme } from '../contexts';

/**
 * A reply's generated UI as it shows in place of the reply's text: as wide as the reply, coming
 * in as it first shows while the agent writes it. UI that throws while it renders shows nothing,
 * and `onError` is told, such as to have the host show the reply's text. An app's component
 * that throws only leaves itself out.
 */
export const AIUIGenerated = ({
  children,
  isStreaming,
  onError,
}: {
  children: ReactNode;
  isStreaming: boolean;
  onError: (error: unknown) => void;
}) => {
  const {
    theme: { generatedUI },
  } = useTheme();
  return (
    <AIUIEntranceStage isStreaming={isStreaming} style={[styles.generated, generatedUI?.container]}>
      <AIUIErrorBoundary onError={onError}>{children}</AIUIErrorBoundary>
    </AIUIEntranceStage>
  );
};

const subscribeToNothing = () => () => undefined;
const noVersion = () => 0;

/**
 * Shows the conversation's replies again whenever the host says what one of them shows changed,
 * such as a finished reply that turned out to show nothing of its own.
 */
export const useAIUIHostRefresh = (host: AIUIHost | undefined) =>
  useSyncExternalStore(
    host ? host.subscribe : subscribeToNothing,
    host ? host.getVersion : noVersion,
  );

export type AIUIViewProps = {
  document: AIUIDocument;
  host: AIUIHost;
  /** The reply the document belongs to. */
  messageId: string;
};

/**
 * One reply's generated UI, for showing replies outside `AIConversation`. It shows nothing when
 * none of the host's renderers shows the document, and the reply's text should show instead:
 * `host.content(document, messageId) !== null` tells which, and `host.subscribe` when that may
 * have changed. Give the host the conversation's messages with `host.receive(messages)` as they
 * change. The counterpart of `AIUIView` in StreamChatAI.
 */
export const AIUIView = ({ document, host, messageId }: AIUIViewProps) => {
  useAIUIHostRefresh(host);
  const content = host.content(document, messageId);
  return content === null ? null : (
    <AIUIGenerated
      isStreaming={document.isStreaming}
      key={messageId}
      onError={(error) => host.fail(messageId, error)}
    >
      {content}
    </AIUIGenerated>
  );
};

const styles = StyleSheet.create({
  generated: { alignSelf: 'stretch' },
});
