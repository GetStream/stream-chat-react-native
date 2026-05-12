import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import type { NotificationTarget, NotificationTargetPanel } from './notificationTarget';

export type NotificationTargetProviderProps = PropsWithChildren<NotificationTarget>;

const NotificationTargetContext = createContext<NotificationTarget | undefined>(undefined);

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

export const useNotificationTargetContext = () => useContext(NotificationTargetContext);

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
