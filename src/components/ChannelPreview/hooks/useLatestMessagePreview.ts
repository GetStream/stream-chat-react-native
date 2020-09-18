import { useEffect, useState } from 'react';

import type { Immutable } from 'seamless-immutable';
import type {
  Channel,
  ChannelState,
  MessageResponse,
  UnknownType,
} from 'stream-chat';

import {
  isDayOrMoment,
  TDateTimeParser,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type LatestMessagePreview<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | {
      created_at: string;
      messageObject: undefined;
      text: string;
    }
  | {
      created_at: string | number | Date;
      messageObject: Immutable<
        ReturnType<
          ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']
        >
      >;
      text: string;
    };

const getLatestMessageDisplayText = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: Immutable<
    ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  >,
  t: (key: string) => string,
) => {
  if (!message) {
    return t('Nothing yet...');
  }
  if (message.deleted_at) {
    return t('Message deleted');
  }
  if (message.text) {
    return message.text;
  }
  if (message.command) {
    return '/' + message.command;
  }
  if (message.attachments?.length) {
    return t('🏙 Attachment...');
  }
  return t('Empty message...');
};

const getLatestMessageDisplayDate = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: Immutable<
    ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  >,
  tDateTimeParser: TDateTimeParser,
) => {
  const parserOutput = tDateTimeParser(message.created_at.asMutable());
  if (isDayOrMoment(parserOutput)) {
    if (parserOutput.isSame(new Date(), 'day'))
      return parserOutput.format('LT');
    else {
      return parserOutput.format('L');
    }
  } else {
    return parserOutput;
  }
};

const getLatestMessagePreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  t: (key: string) => string,
  tDateTimeParser: TDateTimeParser,
) => {
  const messages = channel?.state?.messages;

  if (!messages?.length) {
    return {
      created_at: '',
      messageObject: undefined,
      text: '',
    };
  } else {
    const message = messages[messages.length - 1];

    return {
      created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
      messageObject: { ...message },
      text: getLatestMessageDisplayText(message, t),
    };
  }
};

/**
 * Hook to set the display preview for latest message on channel.
 *
 * @param {*} channel Channel object
 *
 * @returns {object} latest message preview e.g.. { text: 'this was last message ...', created_at: '11/12/2020', messageObject: { originalMessageObject } }
 */
export const useLatestMessagePreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  lastMessage?:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>,
) => {
  const { t, tDateTimeParser } = useTranslationContext();

  const [latestMessagePreview, setLatestMessagePreview] = useState(
    getLatestMessagePreview(channel, t, tDateTimeParser),
  );

  useEffect(() => {
    setLatestMessagePreview(
      getLatestMessagePreview(channel, t, tDateTimeParser),
    );
  }, [channel, lastMessage]);

  return latestMessagePreview;
};
