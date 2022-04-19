import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateOwnCapabilitiesContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  overrideCapabilities,
}: {
  channel: Channel<StreamChatGenerics>;
  overrideCapabilities?: Partial<OwnCapabilitiesContextValue>;
}) => {
  const overrideCapabilitiesStr = overrideCapabilities
    ? JSON.stringify(Object.values(overrideCapabilities))
    : null;
  const ownCapabilitiesStr = channel?.data?.own_capabilities
    ? JSON.stringify(Object.values(channel?.data?.own_capabilities as Array<string>))
    : null;

  const ownCapabilitiesContext: OwnCapabilitiesContextValue = useMemo(() => {
    const capabilities = (channel?.data?.own_capabilities || []) as Array<string>;
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
  }, [channel.id, overrideCapabilitiesStr, ownCapabilitiesStr]);

  return ownCapabilitiesContext;
};
