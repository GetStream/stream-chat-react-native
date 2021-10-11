import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import { BuiltinRoles, ChannelResponse, Role } from 'stream-chat';
import dayjs from 'dayjs';

import { useChannelContext, useChatContext } from '../../contexts';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

type Roles = Array<Role>;

const SECOND_IN_MS = 1000;

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
  const [endsAt, setEndsAt] = useState<Date>(new Date());

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { cooldown } = (channel?.data || {}) as ChannelResponse<Ch, Co, Us>;
  const interval = (cooldown as number) ?? 0;

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
    const now = dayjs();

    if (enabled) {
      setEndsAt(now.add(interval, 'seconds').toDate());
    }
  };

  return { endsAt, start };
};

/**
 * Start a countdown to a set date, in seconds.
 * The date passed in as an argument to useCountdown
 * will be rounded up to the nearest second.
 **/
export const useCountdown = (endsAt: Date) => {
  const [seconds, setSeconds] = useState<number>(0);

  const counter = useRef<number>();

  const update = () => {
    const now = dayjs();

    setSeconds((previous) => {
      const next = previous - 1;

      if (next < 1) {
        /* Don't trigger an unnecessary rerender when done */
        clearInterval(counter.current);
        return 0;
      }
      return next;
    });

  };

  /**
   * When a new value is passed with `endsAt`, calculate the
   * amount of seconds for the counter to start at.
   **/
  useEffect(() => {
    const secondsUntilEndsAt = Math.ceil(dayjs(endsAt).diff(dayjs(), 'seconds', true))
    setSeconds(secondsUntilEndsAt)
  }, [endsAt])


  useEffect(() => {
    const timerId = setInterval(() => {
      update();
    }, SECOND_IN_MS);

    counter.current = timerId;

    return () => {
      clearInterval(counter.current);
    };
  });

  return { seconds };
};

export type CooldownTimerProps = {
  seconds: number;
};

/**
 * Renders an amount of seconds left for a cooldown to finish.
 *
 * See `useCountdown` for an example of how to set a countdown
 * to use as the source of `seconds`.
 **/
export const CooldownTimer = (props: CooldownTimerProps) => {
  const { seconds } = props;

  return <Text testID='cooldown-seconds'>{seconds}</Text>;
};
