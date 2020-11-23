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
      preview: {
        boldIndexEnd: number;
        text: string;
      };
      status: number;
    }
  | {
      created_at: string | number | Date;
      messageObject: Immutable<
        ReturnType<
          ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']
        >
      >;
      preview: {
        boldIndexEnd: number;
        text: string;
      };
      status: number;
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
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  message: Immutable<
    ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  >,
  t: (key: string) => string,
) => {
  if (!message) return { boldIndexEnd: 0, text: t('Nothing yet...') };
  if (message.deleted_at)
    return { boldIndexEnd: 0, text: t('Message deleted') };
  const currentUserId = client.userID;
  const messageOwnerId = message.user?.id;
  const members = Object.keys(channel.state.members);
  const owner =
    messageOwnerId === currentUserId
      ? 'You'
      : members.length > 2
      ? message.user?.name || message.user?.username || message.user?.id || ''
      : '';
  const ownerText = owner ? `${owner === 'You' ? '' : '@'}${owner}: ` : '';
  const boldIndexEnd = ownerText.includes('@') ? ownerText.length - 1 : 0;
  if (message.text) {
    return { boldIndexEnd, text: `${ownerText}${message.text}` };
  }
  if (message.command) {
    return { boldIndexEnd, text: `${ownerText}/${message.command}` };
  }
  if (message.attachments?.length) {
    return { boldIndexEnd, text: `${ownerText}${t('🏙 Attachment...')}` };
  }
  return { boldIndexEnd, text: `${ownerText}${t('Empty message...')}` };
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
  const currentUserId = client.userID;
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

  if (!messages.length) {
    return {
      created_at: '',
      messageObject: undefined,
      preview: {
        boldIndexEnd: 0,
        text: '',
      },
      status: 0,
    };
  }

  const message = messages[messages.length - 1];
  return {
    created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
    messageObject: message,
    preview: getLatestMessageDisplayText(channel, client, message, t),
    status: getLatestMessageReadStatus(channel, client, message),
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
  forceUpdate: number,
  lastMessage?:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, tDateTimeParser } = useTranslationContext();

  const messages = channel.state.messages;
  const message = messages[messages.length - 1];

  const lastMessageId = lastMessage?.id || message?.id;

  const [latestMessagePreview, setLatestMessagePreview] = useState<
    LatestMessagePreview<At, Ch, Co, Ev, Me, Re, Us>
  >({
    created_at: '',
    messageObject: undefined,
    preview: {
      boldIndexEnd: 0,
      text: '',
    },
    status: 0,
  });

  useEffect(() => {
    setLatestMessagePreview(
      getLatestMessagePreview(channel, client, t, tDateTimeParser),
    );
  }, [forceUpdate, lastMessageId]);

  return latestMessagePreview;
};
