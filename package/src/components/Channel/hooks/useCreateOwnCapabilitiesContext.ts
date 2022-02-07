import { useMemo } from 'react';

import type { Channel, ExtendableGenerics } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateOwnCapabilitiesContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  channel,
  overrideCapabilities,
}: {
  channel: Channel<StreamChatClient>;
  overrideCapabilities?: Partial<OwnCapabilitiesContextValue>;
}) => {
  const overrideCapabilitiesStr = overrideCapabilities
    ? JSON.stringify(Object.values(overrideCapabilities))
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
  }, [channel.id, overrideCapabilitiesStr]);
  return ownCapabilitiesContext;
};
