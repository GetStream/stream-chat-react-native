import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreateOwnCapabilitiesContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  channel,
  overrideCapabilities,
}: {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
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
