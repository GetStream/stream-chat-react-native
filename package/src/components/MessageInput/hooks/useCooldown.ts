import { useState } from 'react';
import { BuiltinRoles, ChannelResponse, Role } from 'stream-chat';
import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';
import { ONE_SECOND_IN_MS } from '../../../utils/date';

type Roles = Array<Role>;

/**
 * useCooldown can be used to start a cooldown defined
 * for a Channel by setting an end time for
 **/
export const useCooldown = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>() => {
  const [endsAt, setEndsAt] = useState(new Date());

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { cooldown } = (channel?.data || {}) as ChannelResponse<Ch, Co, Us>;
  const interval: number = cooldown ?? 0;

  /**
   * We get the roles a user has globally set on the Client, and the role
   * they have locally within the chat. If any of the predefined
   * `disabledRoles` are matched to either of the users roles, the user
   * will not have a cooldown at all.
   **/
  const disabledRoles = [BuiltinRoles.Admin, BuiltinRoles.ChannelModerator];
  const userClientRole = client?.user?.role || '';
  const userChannelRole = channel?.state.members[client.userID || '']?.role || '';

  const disabledFor = (roles: Roles) =>
    disabledRoles.some((roleToSkip) => roles.includes(roleToSkip));

  const enabled = interval > 0 && !disabledFor([userClientRole, userChannelRole]);

  const start = () => {
    if (enabled) {
      setEndsAt(new Date(Date.now() + interval * ONE_SECOND_IN_MS));
    }
  };

  return { endsAt, start };
};
