import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import type { LocalMessage } from 'stream-chat';

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

/** Resolved predicate stored on the context: consumers call it with a message. */
export type HasInteractiveAccessibilityContent = (message: LocalMessage) => boolean;

/**
 * Integrator override. Receives the SDK's baseline boolean as the second argument, so an override
 * can extend it:
 *
 * ```
 *   hasInteractiveAccessibilityContent: (message, defaultValue) =>
 *     defaultValue || !!message.my_custom_field
 * ```
 *
 * To replace the baseline, ignore the second argument. Must be stable across renders: an unstable
 * function re-renders every message context consumer.
 */
export type HasInteractiveAccessibilityContentConfig = (
  message: LocalMessage,
  defaultValue: boolean,
) => boolean;

/** SDK baseline: true when the message renders interactive children. */
const defaultHasInteractiveAccessibilityContent: HasInteractiveAccessibilityContent = (message) =>
  !!(
    message.poll_id ||
    message.quoted_message ||
    message.attachments?.length ||
    message.shared_location
  );

export type AccessibilityConfig = {
  /**
   * Master toggle. Defaults to false, so integrators opt in. When false, no accessibility
   * attributes are added, no announcer mounts and no listeners attach.
   */
  enabled?: boolean;
  /** For testing: forces the screen reader UI even when no screen reader is active. */
  forceScreenReaderMode?: boolean;
  /** Announces new messages. Defaults to true. */
  announceNewMessages?: boolean;
  /** Announces the typing indicator. Defaults to false, as it is noisy on mobile. */
  announceTypingIndicator?: boolean;
  /** Announces connection state changes. Defaults to true. */
  announceConnectionState?: boolean;
  /** Gesture alternative for the audio recorder. Defaults to `'auto'`. */
  audioRecorderTapMode?: A11yMode;
  /** Gesture alternative for the image gallery. Defaults to `'auto'`. */
  imageGalleryScreenReaderMode?: A11yMode;
  /**
   * How message actions open: `'long-press'` (no extra button), `'always-button'`, or `'auto'`
   * (a button while a screen reader is on). Defaults to `'auto'`.
   */
  messageActionsTrigger?: 'long-press' | 'auto' | 'always-button';
  /**
   * Overrides whether a message counts as having interactive children, which decides if the
   * children or the bubble handle accessibility.
   * See {@link HasInteractiveAccessibilityContentConfig}.
   */
  hasInteractiveAccessibilityContent?: HasInteractiveAccessibilityContentConfig;
};

/** Fully resolved config: every field is populated with its default. */
export type ResolvedAccessibilityConfig = Required<
  Omit<AccessibilityConfig, 'hasInteractiveAccessibilityContent'>
> & {
  hasInteractiveAccessibilityContent: HasInteractiveAccessibilityContent;
};

export const accessibilityContextDefaultValue: ResolvedAccessibilityConfig = {
  announceConnectionState: true,
  announceNewMessages: true,
  announceTypingIndicator: false,
  audioRecorderTapMode: 'auto',
  enabled: false,
  forceScreenReaderMode: false,
  hasInteractiveAccessibilityContent: defaultHasInteractiveAccessibilityContent,
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
    hasInteractiveAccessibilityContent,
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
      hasInteractiveAccessibilityContent: hasInteractiveAccessibilityContent
        ? (message) =>
            hasInteractiveAccessibilityContent(
              message,
              accessibilityContextDefaultValue.hasInteractiveAccessibilityContent(message),
            )
        : accessibilityContextDefaultValue.hasInteractiveAccessibilityContent,
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
      hasInteractiveAccessibilityContent,
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
