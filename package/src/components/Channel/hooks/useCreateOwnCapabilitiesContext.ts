import { useMemo } from 'react';

import type { Channel, OwnCapabilitiesState } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useStateStore } from '../../../hooks/useStateStore';

// TODO: Move own_capabilities as part of channel state rather than having to do
//       stuff like this.
const selector = (state: OwnCapabilitiesState) => ({
  ownCapabilities: state.ownCapabilities.join(','),
});

export const useCreateOwnCapabilitiesContext = ({
  channel,
  overrideCapabilities,
}: {
  channel: Channel;
  overrideCapabilities?: Partial<OwnCapabilitiesContextValue>;
}) => {
  // Sourced reactively from channel.state (kept up to date by the client
  // on watch/query and `capabilities.changed`).
  const { ownCapabilities } = useStateStore(channel.state, selector);

  const overrideCapabilitiesKey = overrideCapabilities
    ? JSON.stringify(overrideCapabilities)
    : undefined;

  const ownCapabilitiesContext: OwnCapabilitiesContextValue = useMemo(() => {
    const capabilities = ownCapabilities.split(',');
    return Object.keys(allOwnCapabilities).reduce(
      (result, capability) => ({
        ...result,
        [capability]:
          overrideCapabilities?.[capability as OwnCapability] ??
          capabilities.includes(allOwnCapabilities[capability as OwnCapability]),
      }),
      {} as OwnCapabilitiesContextValue,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideCapabilitiesKey, ownCapabilities]);

  return ownCapabilitiesContext;
};
