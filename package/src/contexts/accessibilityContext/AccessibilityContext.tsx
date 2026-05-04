import React, { PropsWithChildren, useContext, useMemo } from 'react';

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

export const AccessibilityProvider = ({
  children,
  value,
}: PropsWithChildren<{ value?: AccessibilityConfig }>) => {
  const resolved = useMemo<ResolvedAccessibilityConfig>(
    () => ({ ...accessibilityContextDefaultValue, ...value }),
    [value],
  );

  return <AccessibilityContext.Provider value={resolved}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibilityContext = () => useContext(AccessibilityContext);
