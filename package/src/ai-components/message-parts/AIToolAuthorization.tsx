import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { isAuthorizationExpired, isAwaitingAuthorization } from './parseMessageParts';
import type { AIToolAuthorizationData, AIToolCallPart } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useNow } from '../internal/format';
import {
  type AIToolApprover,
  type AIToolAuthorizer,
  useAIToolApprover,
} from '../tool-calls/AIToolApprover';

/** Where the person's answer to a sign-in is. */
export type AIToolAuthorizationState = {
  /** The sign-in couldn't be opened, and the person can try again. */
  connectFailed: boolean;
  /** Their "not now" couldn't be sent, and the person can answer again. */
  declineFailed: boolean;
  /** The sign-in is open, or done and the call's step hasn't changed yet. */
  isConnecting: boolean;
  /** Their "not now" is on its way, or arrived and the call's step hasn't changed yet. */
  isDeclining: boolean;
};

const idle: AIToolAuthorizationState = {
  connectFailed: false,
  declineFailed: false,
  isConnecting: false,
  isDeclining: false,
};

export type AIToolAuthorizationCardProps = {
  authorization: AIToolAuthorizationData;
  onConnect: () => void;
  onDecline: () => void;
  state?: AIToolAuthorizationState;
};

/**
 * Asks the person to sign in at a provider a tool call needs, such as "Connect Linear", with a
 * Connect and a Not now button. Once the sign-in is over it says how it ended (connected,
 * declined, expired or failed), and a sign-in past its expiry can no longer be opened. The
 * counterpart of `AIToolAuthorizationCard`.
 */
export const AIToolAuthorizationCard = ({
  authorization,
  onConnect,
  onDecline,
  state = idle,
}: AIToolAuthorizationCardProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const card = messageParts?.authorizationCard;
  const open = authorization.status === undefined;
  // Re-checked every few seconds while it is open, so it turns expired on its own.
  const now = useNow(open && authorization.expiresAt !== undefined, 5000);
  const expired = isAuthorizationExpired(authorization, now);
  const provider = authorization.providerName ?? authorization.provider;
  const busy = state.isConnecting || state.isDeclining;

  const outcome = (() => {
    if (expired) return t('This sign-in has expired.');
    switch (authorization.status) {
      case undefined:
        return undefined;
      case 'connected':
        return t('Connected to {{ provider }}', { provider });
      case 'declined':
        return t('Not connected');
      default:
        return t("The sign-in didn't complete.");
    }
  })();

  const failure = (() => {
    if (state.connectFailed) return t("The sign-in couldn't be opened. Try again.");
    if (state.declineFailed) return t("Your answer couldn't be sent. Try again.");
    return undefined;
  })();

  return (
    <View
      accessibilityState={{ busy }}
      style={[
        styles.container,
        { backgroundColor: colors.white, borderColor: colors.grey_gainsboro },
        card?.container,
      ]}
      testID='ai-tool-authorization-card'
    >
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.black }, card?.title]}>
          {authorization.title}
        </Text>
        {authorization.message ? (
          <Text style={[styles.message, { color: colors.grey }, card?.message]}>
            {authorization.message}
          </Text>
        ) : null}
      </View>
      {outcome ? (
        <Text style={[styles.message, { color: colors.grey }, card?.outcome]}>{outcome}</Text>
      ) : null}
      {open ? (
        <View style={styles.actions}>
          {!expired ? (
            <Pressable
              accessibilityRole='button'
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onConnect}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.accent_blue, opacity: pressed ? 0.7 : 1 },
                card?.connectButton,
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.white }, card?.connectButtonText]}>
                {state.isConnecting ? t('Connecting...') : t('Connect')}
              </Text>
            </Pressable>
          ) : null}
          {/* Left enabled while the sign-in is open, so one that never comes back leaves a way out. */}
          <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled: state.isDeclining }}
            disabled={state.isDeclining}
            onPress={onDecline}
            style={({ pressed }) => [
              styles.button,
              styles.declineButton,
              { borderColor: colors.grey_gainsboro, opacity: pressed ? 0.7 : 1 },
              card?.declineButton,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.black }, card?.declineButtonText]}>
              {t('Not now')}
            </Text>
          </Pressable>
          {busy ? <ActivityIndicator color={colors.grey} size='small' /> : null}
        </View>
      ) : null}
      {failure ? (
        <Text
          accessibilityRole='alert'
          style={[styles.failure, { color: colors.accent_red }, card?.failure]}
        >
          {failure}
        </Text>
      ) : null}
    </View>
  );
};

/**
 * The sign-in this person is asked for on `call` here: one the call waits for them to finish,
 * of a kind this device opens, and only when they can sign in on it.
 */
export const signInFor = (call: AIToolCallPart, approver: AIToolApprover | undefined) => {
  if (!approver?.authorizer || !isAwaitingAuthorization(call, approver.userId)) return;
  return call.authorization?.type === 'oauth' ? call.authorization : undefined;
};

export type AIToolAuthorizationProps = {
  part: AIToolCallPart;
  /** Who answers on this device, with the `authorizer` the sign-in needs. Defaults to the one of the nearest `AIToolApproverProvider`. */
  approver?: AIToolApprover;
  /** Renders the sign-in, instead of `AIToolAuthorizationCard`. */
  children?: (
    authorization: AIToolAuthorizationData,
    state: AIToolAuthorizationState,
    actions: { connect: () => void; decline: () => void },
  ) => ReactNode;
};

/**
 * Asks for the sign-in of a tool call that waits for this person, and runs it with
 * `approver.authorizer`. Renders nothing for a call that does not wait for them, or without an
 * authorizer. The counterpart of `AIToolAuthorizationView`.
 */
export const AIToolAuthorization = ({
  approver: approverProp,
  children,
  part,
}: AIToolAuthorizationProps) => {
  const approver = useAIToolApprover(approverProp);
  const [state, setState] = useState<AIToolAuthorizationState>(idle);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const authorization = signInFor(part, approver);
  const authorizer = approver?.authorizer;
  if (!authorization || !authorizer) return null;

  const update = (next: AIToolAuthorizationState) => {
    if (mounted.current) setState(next);
  };

  const connect = (signIn: AIToolAuthorizer) => {
    if (state.isConnecting || state.isDeclining) return;
    setState({ ...idle, isConnecting: true });
    signIn.connect(part).then(
      // Your backend has the provider's answer before the sign-in comes back, and its change to
      // the step hides this. Until then it says it is connecting, unless the person closed the
      // sign-in or the provider did not connect them.
      (connected) => {
        if (!connected) update(idle);
      },
      () => update({ ...idle, connectFailed: true }),
    );
  };

  const decline = (signIn: AIToolAuthorizer) => {
    if (state.isDeclining) return;
    setState({ ...idle, isDeclining: true });
    signIn.decline(part).catch(() => update({ ...idle, declineFailed: true }));
  };

  const actions = {
    connect: () => connect(authorizer),
    decline: () => decline(authorizer),
  };

  return (
    <>
      {children ? (
        children(authorization, state, actions)
      ) : (
        <AIToolAuthorizationCard
          authorization={authorization}
          onConnect={actions.connect}
          onDecline={actions.decline}
          state={state}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    alignItems: 'center',
    borderRadius: 9999,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  buttonText: { fontSize: 14, fontWeight: '600' },
  container: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 12 },
  declineButton: { borderWidth: 1 },
  failure: { fontSize: 13 },
  message: { fontSize: 14, lineHeight: 20 },
  text: { gap: 4 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
});
