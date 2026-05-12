import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import type { NotificationTarget, NotificationTargetPanel } from './notificationTarget';

/** Provides the default notification target for SDK actions rendered inside this subtree. */
export type NotificationTargetProviderProps = PropsWithChildren<NotificationTarget>;

const NotificationTargetContext = createContext<NotificationTarget | undefined>(undefined);

/** Makes notifications emitted by descendants resolve to a specific panel and host id. */
export const NotificationTargetProvider = ({
  children,
  hostId,
  panel,
}: NotificationTargetProviderProps) => {
  const value = useMemo(() => ({ hostId, panel }), [hostId, panel]);

  return (
    <NotificationTargetContext.Provider value={value}>
      {children}
    </NotificationTargetContext.Provider>
  );
};

/** Returns the nearest notification target, if the caller is rendered inside a target provider. */
export const useNotificationTargetContext = () => useContext(NotificationTargetContext);

/** Resolves an explicit target or falls back to the nearest compatible target provider. */
export const useResolvedNotificationTarget = ({
  hostId,
  panel,
}: {
  hostId?: string;
  panel?: NotificationTargetPanel;
} = {}) => {
  const contextTarget = useNotificationTargetContext();

  return useMemo(() => {
    if (hostId && panel) return { hostId, panel };
    if (!hostId && !panel) return contextTarget;
    if (panel && contextTarget?.panel === panel) return contextTarget;

    return undefined;
  }, [contextTarget, hostId, panel]);
};
