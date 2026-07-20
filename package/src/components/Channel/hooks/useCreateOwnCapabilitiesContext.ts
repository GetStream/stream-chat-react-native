import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { ownCapabilities: string[] }) => ({
  ownCapabilities: state.ownCapabilities,
});

export const useCreateOwnCapabilitiesContext = ({
  channel,
  overrideCapabilities,
}: {
  channel: Channel;
  overrideCapabilities?: Partial<OwnCapabilitiesContextValue>;
}) => {
  // Sourced reactively from channel.state.ownCapabilitiesStore (kept up to date by the client
  // on watch/query and `capabilities.changed`).
  const { ownCapabilities = [] } =
    useStateStore(channel.state.ownCapabilitiesStore, selector) ?? {};

  const overrideCapabilitiesStr = overrideCapabilities
    ? JSON.stringify(Object.values(overrideCapabilities))
    : null;
  const ownCapabilitiesStr = JSON.stringify(ownCapabilities);

  const ownCapabilitiesContext: OwnCapabilitiesContextValue = useMemo(() => {
    const capabilities = ownCapabilities as Array<string>;
    return Object.keys(allOwnCapabilities).reduce(
      (result, capability) => ({
        ...result,
        [capability]:
          overrideCapabilities?.[capability as OwnCapability] ??
          !!capabilities.includes(allOwnCapabilities[capability as OwnCapability]),
      }),
      {} as OwnCapabilitiesContextValue,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, overrideCapabilitiesStr, ownCapabilitiesStr]);

  return ownCapabilitiesContext;
};
