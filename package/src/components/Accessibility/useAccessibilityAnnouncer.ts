import { createContext, useContext } from 'react';

export type AccessibilityAnnouncePriority = 'assertive' | 'polite';
export type AccessibilityAnnounce = (
  message: string,
  priority?: AccessibilityAnnouncePriority,
) => void;

export type AccessibilityAnnouncerContextValue = {
  announce: AccessibilityAnnounce;
};

const noopAnnounce: AccessibilityAnnounce = () => undefined;

export const AccessibilityAnnouncerContext = createContext<
  AccessibilityAnnouncerContextValue | undefined
>(undefined);

/**
 * Returns the imperative announcer. When called outside the AccessibilityAnnouncer
 * provider (which happens any time the SDK's a11y is disabled, since the provider
 * doesn't mount in that case), this returns a no-op.
 *
 * Mirrors the React SDK's `useAriaLiveAnnouncer` so cross-SDK code reads the same.
 */
export const useAccessibilityAnnouncer = (): AccessibilityAnnounce => {
  const contextValue = useContext(AccessibilityAnnouncerContext);
  if (!contextValue) return noopAnnounce;
  return contextValue.announce;
};
