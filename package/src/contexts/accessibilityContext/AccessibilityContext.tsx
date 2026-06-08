import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import { AccessibilityAnnouncerContext } from '../../components/Accessibility/useAccessibilityAnnouncer';
import type {
  AccessibilityAnnounce,
  AccessibilityAnnouncePriority,
} from '../../components/Accessibility/useAccessibilityAnnouncer';

const ANNOUNCE_DEBOUNCE_MS = 50;

type SequenceByPriority = { [key in AccessibilityAnnouncePriority]: number };
type TimeoutByPriority = {
  [key in AccessibilityAnnouncePriority]: ReturnType<typeof setTimeout> | undefined;
};

/** Tri-state for gesture-alternative toggles. */
export type A11yMode = 'auto' | 'always' | 'never';

export type AccessibilityConfig = {
  /**
   * Master toggle. Default FALSE — integrators must opt in. When false, the SDK
   * behaves exactly as it does today; no a11y attributes are added, no announcer
   * mounts, no listeners attached.
   */
  enabled?: boolean;
  /** For testing — force "screen reader on" UI even when no SR is active. */
  forceScreenReaderMode?: boolean;
  /** Announce new messages via the announcer. Default true (when enabled). */
  announceNewMessages?: boolean;
  /** Announce typing indicator. Default false (noisy on mobile). */
  announceTypingIndicator?: boolean;
  /** Announce connection state (offline/online). Default true. */
  announceConnectionState?: boolean;
  /** Audio recorder gesture-alternative. 'auto' (default), 'always', 'never'. */
  audioRecorderTapMode?: A11yMode;
  /** Image gallery gesture-alternative. 'auto' (default), 'always', 'never'. */
  imageGalleryScreenReaderMode?: A11yMode;
  /** Message actions trigger. 'long-press' (no alt button), 'auto' (default — show button when SR is on), 'always-button'. */
  messageActionsTrigger?: 'long-press' | 'auto' | 'always-button';
};

/** Fully-resolved config — every field is populated with its default. */
export type ResolvedAccessibilityConfig = Required<AccessibilityConfig>;

export const accessibilityContextDefaultValue: ResolvedAccessibilityConfig = {
  announceConnectionState: true,
  announceNewMessages: true,
  announceTypingIndicator: false,
  audioRecorderTapMode: 'auto',
  enabled: false,
  forceScreenReaderMode: false,
  imageGalleryScreenReaderMode: 'auto',
  messageActionsTrigger: 'auto',
};

export const AccessibilityContext = React.createContext<ResolvedAccessibilityConfig>(
  accessibilityContextDefaultValue,
);

const AccessibilityAnnouncerProvider = ({ children }: PropsWithChildren) => {
  const sequenceByPriorityRef = useRef<SequenceByPriority>({ assertive: 0, polite: 0 });
  const timeoutByPriorityRef = useRef<TimeoutByPriority>({
    assertive: undefined,
    polite: undefined,
  });
  const unmountedRef = useRef(false);

  const clearPendingTimeout = useCallback((priority: AccessibilityAnnouncePriority) => {
    if (!timeoutByPriorityRef.current[priority]) return;
    clearTimeout(timeoutByPriorityRef.current[priority]);
    timeoutByPriorityRef.current[priority] = undefined;
  }, []);

  const announce = useCallback<AccessibilityAnnounce>(
    (message, priority = 'polite') => {
      if (!message) return;
      const sequence = sequenceByPriorityRef.current[priority] + 1;
      sequenceByPriorityRef.current[priority] = sequence;
      clearPendingTimeout(priority);
      timeoutByPriorityRef.current[priority] = setTimeout(() => {
        if (unmountedRef.current) return;
        if (sequenceByPriorityRef.current[priority] !== sequence) return;
        AccessibilityInfo.announceForAccessibility(message);
        timeoutByPriorityRef.current[priority] = undefined;
      }, ANNOUNCE_DEBOUNCE_MS);
    },
    [clearPendingTimeout],
  );

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearPendingTimeout('assertive');
      clearPendingTimeout('polite');
    };
  }, [clearPendingTimeout]);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  return (
    <AccessibilityAnnouncerContext.Provider value={contextValue}>
      {children}
    </AccessibilityAnnouncerContext.Provider>
  );
};

export const AccessibilityProvider = ({
  children,
  value,
}: PropsWithChildren<{ value?: AccessibilityConfig }>) => {
  const {
    announceConnectionState = accessibilityContextDefaultValue.announceConnectionState,
    announceNewMessages = accessibilityContextDefaultValue.announceNewMessages,
    announceTypingIndicator = accessibilityContextDefaultValue.announceTypingIndicator,
    audioRecorderTapMode = accessibilityContextDefaultValue.audioRecorderTapMode,
    enabled = accessibilityContextDefaultValue.enabled,
    forceScreenReaderMode = accessibilityContextDefaultValue.forceScreenReaderMode,
    imageGalleryScreenReaderMode = accessibilityContextDefaultValue.imageGalleryScreenReaderMode,
    messageActionsTrigger = accessibilityContextDefaultValue.messageActionsTrigger,
  } = value ?? {};

  const resolved = useMemo<ResolvedAccessibilityConfig>(
    () => ({
      announceConnectionState,
      announceNewMessages,
      announceTypingIndicator,
      audioRecorderTapMode,
      enabled,
      forceScreenReaderMode,
      imageGalleryScreenReaderMode,
      messageActionsTrigger,
    }),
    [
      announceConnectionState,
      announceNewMessages,
      announceTypingIndicator,
      audioRecorderTapMode,
      enabled,
      forceScreenReaderMode,
      imageGalleryScreenReaderMode,
      messageActionsTrigger,
    ],
  );

  return (
    <AccessibilityContext.Provider value={resolved}>
      {enabled ? (
        <AccessibilityAnnouncerProvider>{children}</AccessibilityAnnouncerProvider>
      ) : (
        children
      )}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibilityContext = (): ResolvedAccessibilityConfig =>
  useContext(AccessibilityContext);
