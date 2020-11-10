import { useEffect, useState } from 'react';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  isDayOrMoment,
  TDateTimeParser,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import type { Immutable } from 'seamless-immutable';
import type {
  Channel,
  ChannelState,
  MessageResponse,
  StreamChat,
} from 'stream-chat';

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
      status: number;
      text: string;
    }
  | {
      created_at: string | number | Date;
      messageObject: Immutable<
        ReturnType<
          ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']
        >
      >;
      status: number;
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
  if (!message) return t('Nothing yet...');
  if (message.deleted_at) return t('Message deleted');
  if (message.text) return message.text;
  if (message.command) return '/' + message.command;
  if (message.attachments?.length) return t('🏙 Attachment...');
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
    if (parserOutput.isSame(new Date(), 'day')) {
      return parserOutput.format('LT');
    }
    return parserOutput.format('L');
  }
  return parserOutput;
};

/**
 * set up enum
 * 0 = latest message is not current user's message
 * 1 = nobody has read latest message which is the current user's message
 * 2 = someone has read latest message which is the current user's message
 */
const getLatestMessageReadStatus = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  message: Immutable<
    ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  >,
) => {
  const currentUserId = client.user?.id;
  if (currentUserId !== message.user?.id) return 0;

  const readList = channel.state.read.asMutable();
  if (currentUserId) {
    delete readList[currentUserId];
  }

  return Object.values(readList).some(
    ({ last_read }) => message.updated_at < last_read,
  )
    ? 2
    : 1;
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
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  t: (key: string) => string,
  tDateTimeParser: TDateTimeParser,
) => {
  const messages = channel.state.messages;

  if (!messages?.length) {
    return {
      created_at: '',
      messageObject: undefined,
      status: 0,
      text: '',
    };
  }

  const message = messages[messages.length - 1];
  return {
    created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
    messageObject: message,
    status: getLatestMessageReadStatus(channel, client, message),
    text: getLatestMessageDisplayText(message, t),
  };
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
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, tDateTimeParser } = useTranslationContext();

  const messages = channel.state.messages;
  const message = messages[messages.length - 1];

  const lastMessageId = lastMessage?.id || message.id;

  const [latestMessagePreview, setLatestMessagePreview] = useState(
    getLatestMessagePreview(channel, client, t, tDateTimeParser),
  );

  useEffect(() => {
    setLatestMessagePreview(
      getLatestMessagePreview(channel, client, t, tDateTimeParser),
    );
  }, [lastMessageId]);

  return latestMessagePreview;
};
