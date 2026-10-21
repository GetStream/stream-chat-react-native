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
 * Returns the function that announces a message to the screen reader. Outside the announcer
 * context, as when SDK accessibility is disabled, it is a no-op.
 *
 * @returns The `announce` function.
 */
export const useAccessibilityAnnouncer = (): AccessibilityAnnounce => {
  const contextValue = useContext(AccessibilityAnnouncerContext);
  if (!contextValue) return noopAnnounce;
  return contextValue.announce;
};
