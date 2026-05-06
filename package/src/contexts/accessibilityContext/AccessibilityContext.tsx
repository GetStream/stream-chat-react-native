import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

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

export const IMPORTANT_ACCESSIBILITY_ELEMENT_IDS = {
  attachmentPickerMediaButton: 'attachmentPicker.mediaButton',
} as const;

type ImportantAccessibilityNativeElement = NonNullable<Parameters<typeof findNodeHandle>[0]>;

type ImportantAccessibilityElementRegistry = {
  [IMPORTANT_ACCESSIBILITY_ELEMENT_IDS.attachmentPickerMediaButton]: ImportantAccessibilityNativeElement;
};

export type ImportantAccessibilityElementId = keyof ImportantAccessibilityElementRegistry;

export type ImportantAccessibilityElementRef<Id extends ImportantAccessibilityElementId> =
  React.RefObject<ImportantAccessibilityElementRegistry[Id] | null>;

type ImportantAccessibilityElements = Partial<{
  [Id in ImportantAccessibilityElementId]: ImportantAccessibilityElementRef<Id>;
}>;

type ImportantAccessibilityElementsContextValue = {
  importantElements: React.MutableRefObject<ImportantAccessibilityElements>;
  focusImportantAccessibilityElement: (id: ImportantAccessibilityElementId) => boolean;
  registerImportantAccessibilityElement: <Id extends ImportantAccessibilityElementId>(
    id: Id,
    ref: ImportantAccessibilityElementRef<Id>,
  ) => void;
  unregisterImportantAccessibilityElement: <Id extends ImportantAccessibilityElementId>(
    id: Id,
    ref: ImportantAccessibilityElementRef<Id>,
  ) => void;
};

type AccessibilityContextValue = ResolvedAccessibilityConfig &
  ImportantAccessibilityElementsContextValue;

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

const defaultImportantElements = { current: {} };

const importantAccessibilityElementsDefaultValue: ImportantAccessibilityElementsContextValue = {
  importantElements: defaultImportantElements,
  focusImportantAccessibilityElement: () => false,
  registerImportantAccessibilityElement: () => undefined,
  unregisterImportantAccessibilityElement: () => undefined,
};

export const AccessibilityContext = React.createContext<AccessibilityContextValue>({
  ...accessibilityContextDefaultValue,
  ...importantAccessibilityElementsDefaultValue,
});

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

  const importantElements = useRef<ImportantAccessibilityElements>({});

  const registerImportantAccessibilityElement = useCallback(
    <Id extends ImportantAccessibilityElementId>(
      id: Id,
      ref: ImportantAccessibilityElementRef<Id>,
    ) => {
      importantElements.current[id] = ref;
    },
    [],
  );

  const unregisterImportantAccessibilityElement = useCallback(
    <Id extends ImportantAccessibilityElementId>(
      id: Id,
      ref: ImportantAccessibilityElementRef<Id>,
    ) => {
      if (importantElements.current[id] === ref) {
        delete importantElements.current[id];
      }
    },
    [],
  );

  const focusImportantAccessibilityElement = useCallback((id: ImportantAccessibilityElementId) => {
    const element = importantElements.current[id]?.current;

    if (!element) {
      return false;
    }

    const reactTag = findNodeHandle(element);

    if (!reactTag) {
      return false;
    }

    AccessibilityInfo.setAccessibilityFocus(reactTag);
    return true;
  }, []);

  const contextValue = useMemo<AccessibilityContextValue>(
    () => ({
      ...resolved,
      importantElements,
      focusImportantAccessibilityElement,
      registerImportantAccessibilityElement,
      unregisterImportantAccessibilityElement,
    }),
    [
      resolved,
      focusImportantAccessibilityElement,
      registerImportantAccessibilityElement,
      unregisterImportantAccessibilityElement,
    ],
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {enabled ? (
        <AccessibilityAnnouncerProvider>{children}</AccessibilityAnnouncerProvider>
      ) : (
        children
      )}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibilityContext = (): ResolvedAccessibilityConfig => {
  const {
    announceConnectionState,
    announceNewMessages,
    announceTypingIndicator,
    audioRecorderTapMode,
    enabled,
    forceScreenReaderMode,
    imageGalleryScreenReaderMode,
    messageActionsTrigger,
  } = useContext(AccessibilityContext);

  return useMemo(
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
};

export const useImportantAccessibilityElements = () => {
  const {
    importantElements,
    focusImportantAccessibilityElement,
    registerImportantAccessibilityElement,
    unregisterImportantAccessibilityElement,
  } = useContext(AccessibilityContext);

  return useMemo(
    () => ({
      importantElements,
      focusImportantAccessibilityElement,
      registerImportantAccessibilityElement,
      unregisterImportantAccessibilityElement,
    }),
    [
      importantElements,
      focusImportantAccessibilityElement,
      registerImportantAccessibilityElement,
      unregisterImportantAccessibilityElement,
    ],
  );
};

export const useRegisterImportantAccessibilityElement = <
  Id extends ImportantAccessibilityElementId,
>(
  id: Id,
  ref: ImportantAccessibilityElementRef<Id>,
) => {
  const { registerImportantAccessibilityElement, unregisterImportantAccessibilityElement } =
    useImportantAccessibilityElements();

  useEffect(() => {
    registerImportantAccessibilityElement(id, ref);
    return () => unregisterImportantAccessibilityElement(id, ref);
  }, [id, ref, registerImportantAccessibilityElement, unregisterImportantAccessibilityElement]);
};

export const useImportantAccessibilityElementRef = <Id extends ImportantAccessibilityElementId>(
  id: Id,
) => {
  const ref = useRef<ImportantAccessibilityElementRegistry[Id] | null>(null);
  useRegisterImportantAccessibilityElement(id, ref);
  return ref;
};
