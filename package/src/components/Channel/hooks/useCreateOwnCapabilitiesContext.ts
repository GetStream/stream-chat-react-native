import { useEffect, useMemo, useState } from 'react';

import type { Channel } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';

export const useCreateOwnCapabilitiesContext = ({
  channel,
  overrideCapabilities,
}: {
  channel: Channel;
  overrideCapabilities?: Partial<OwnCapabilitiesContextValue>;
}) => {
  const [own_capabilities, setOwnCapabilites] = useState(
    JSON.stringify(channel.data?.own_capabilities as Array<string>),
  );
  const overrideCapabilitiesStr = overrideCapabilities
    ? JSON.stringify(Object.values(overrideCapabilities))
    : null;

  // Effect to watch for changes in channel.data?.own_capabilities and update the own_capabilities state accordingly.
  useEffect(() => {
    setOwnCapabilites(JSON.stringify(channel.data?.own_capabilities as Array<string>));
  }, [channel.data?.own_capabilities]);

  // Effect to listen to the `capabilities.changed` event.
  useEffect(() => {
    const listener = channel.on('capabilities.changed', (event) => {
      if (event.own_capabilities) {
        setOwnCapabilites(JSON.stringify(event.own_capabilities as Array<string>));
      }
    });

    return () => {
      listener.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownCapabilitiesContext: OwnCapabilitiesContextValue = useMemo(() => {
    const capabilities = (own_capabilities || []) as Array<string>;
    const ownCapabilitiesContext = Object.keys(allOwnCapabilities).reduce(
      (result, capability) => ({
        ...result,
        [capability]:
          overrideCapabilities?.[capability as OwnCapability] ??
          !!capabilities.includes(allOwnCapabilities[capability as OwnCapability]),
      }),
      {} as OwnCapabilitiesContextValue,
    );

    return ownCapabilitiesContext;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, overrideCapabilitiesStr, own_capabilities]);

  return ownCapabilitiesContext;
};
