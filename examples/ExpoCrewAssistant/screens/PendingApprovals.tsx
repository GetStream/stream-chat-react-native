import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Session, ToolApprovalRequest } from '@stream-io/calypso';
import { useStateStore } from 'stream-chat-expo';
import { AIToolApprovalCard } from 'stream-chat-expo/ai-components';

import type { AgentChat, AgentChatState } from '../agent/agentChat';

const NONE: readonly ToolApprovalRequest[] = [];

const sessionSelector = ({ session }: AgentChatState) => ({ session });

// What the call would do, in a line, from the arguments the model wrote.
const detailsOf = ({ arguments: written }: ToolApprovalRequest) => {
  try {
    const parsed = JSON.parse(written) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${String(value)}`)
      .join(' · ');
  } catch {
    return undefined;
  }
};

const Requests = ({ session }: { session: Session }) => {
  const approvals = useSyncExternalStore(
    session.conversation.subscribe,
    () => session.conversation.get().approvals ?? NONE,
  );
  if (approvals.length === 0) return null;
  return (
    <View style={styles.container}>
      {approvals.map((request) => (
        <AIToolApprovalCard
          approval={{
            allowTitle: request.approval.allowTitle,
            declineTitle: 'Not now',
            message: request.approval.message,
            reason: request.reason || detailsOf(request),
            title: request.approval.title,
          }}
          key={request.id}
          onDecide={(allowed) => session.decide(request.id, { allowed })}
        />
      ))}
    </View>
  );
};

/**
 * The calls of the phone's tools that ask first, waiting for the person, above the composer. The
 * phone asks through `responses.create`, so these wait on its session rather than on the reply's
 * step, and the person answers them here.
 */
export const PendingApprovals = ({ chat }: { chat: AgentChat }) => {
  const { session } = useStateStore(chat.state, sessionSelector);
  return session ? <Requests session={session} /> : null;
};

const styles = StyleSheet.create({
  container: { gap: 8, paddingBottom: 8, paddingHorizontal: 16 },
});
