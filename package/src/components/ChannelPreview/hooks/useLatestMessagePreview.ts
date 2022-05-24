import { useEffect, useState } from 'react';

import type { Channel, ChannelState, MessageResponse, StreamChat, User } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  isDayOrMoment,
  TDateTimeParser,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useTranslatedMessage } from '../../Message/MessageSimple/MessageTextContainer';

export type LatestMessage<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> =
  | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
  | MessageResponse<StreamChatGenerics>;

export type LatestMessagePreview<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  created_at: string | number | Date;
  messageObject: LatestMessage<StreamChatGenerics> | undefined;
  previews: {
    bold: boolean;
    text: string;
  }[];
  status: number;
};

const getChannelMembers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => (channel.state ? Object.keys(channel.state.members) : []);

const getMessageUserNameOrID = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics>,
) => message.user?.name || message.user?.username || message.user?.id || '';

const truncateMessageText = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics>,
) => message.text && message.text.substring(0, 100).replace(/\n/g, ' ');

const createDiplayTextObjects = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics>,
  t: (key: string) => string,
) => {
  if (message.text) {
    return createMessageTextDisplayObjects(message);
  }

  if (message.command) {
    return [{ bold: false, text: `/${message.command}` }];
  }

  if (message.attachments?.length) {
    return [{ bold: false, text: t('🏙 Attachment...') }];
  }

  return [{ bold: false, text: t('Empty message...') }];
};

const createMessageTextDisplayObjects = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics>,
) => {
  const shortenedText = truncateMessageText(message) || '';

  const mentionedUsers = message.mentioned_users
    ?.map((user: User) => `(@${user.name || user.id || ''})`)
    .join('|');

  const mentionedUsersRegExp = new RegExp(`${mentionedUsers}|(!:${mentionedUsers})`, 'mg');

  if (mentionedUsers?.length) {
    return [
      ...shortenedText
        .split(mentionedUsersRegExp)
        .filter(isUndefinedOrEmpty)
        .map(createDisplayTextObjectFromString),
    ];
  }

  return [{ bold: false, text: shortenedText }];
};

const isUndefinedOrEmpty = (s: string | undefined) => s !== undefined && s !== '';

const createDisplayTextObjectFromString = (s: string) => {
  if (s.includes('@')) {
    return { bold: true, text: s };
  }

  return { bold: false, text: s };
};

export const getLatestMessageDisplayText = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
  message: LatestMessage<StreamChatGenerics> | undefined,
  t: (key: string) => string,
) => {
  if (!message) return [createDisplayTextObjectFromString(t('Nothing yet...'))];
  if (message.type === 'deleted') return [createDisplayTextObjectFromString(t('Message deleted'))];

  const createMessageOwnerString = (
    messageOwnerId: string | undefined,
    currentUserId: string | undefined,
  ) => {
    if (messageOwnerId === currentUserId) {
      return `${t('You')}: `;
    }

    const messageUserNameOrID = getMessageUserNameOrID(message);
    const channelHasMoreThanTwoMembers = getChannelMembers(channel).length > 2;
    if (messageUserNameOrID && channelHasMoreThanTwoMembers) {
      return `@${messageUserNameOrID}: `;
    }

    return '';
  };

  const owner = createMessageOwnerString(message.user?.id, client.userID);
  const boldOwner = owner.includes('@');

  return [{ bold: boldOwner, text: owner }, ...createDiplayTextObjects(message, t)];
};

const getLatestMessageDisplayDate = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics> | undefined,
  tDateTimeParser: TDateTimeParser,
) => {
  const parserOutput = tDateTimeParser(message?.created_at);
  if (isDayOrMoment(parserOutput)) {
    if (parserOutput.isSame(new Date(), 'day')) {
      return parserOutput.format('LT');
    }
    return parserOutput.format('L');
  }
  return parserOutput;
};

export enum MessageReadStatus {
  NOT_SENT_BY_CURRENT_USER = 0,
  UNREAD = 1,
  READ = 2,
}

const getLatestMessageReadStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
  message: LatestMessage<StreamChatGenerics> | undefined,
  readEvents: boolean,
): MessageReadStatus => {
  const currentUserId = client.userID;
  if (!message || currentUserId !== message.user?.id || readEvents === false) {
    return MessageReadStatus.NOT_SENT_BY_CURRENT_USER;
  }

  const readList = channel.state.read;
  if (currentUserId) {
    delete readList[currentUserId];
  }

  const messageUpdatedAt = message.updated_at
    ? typeof message.updated_at === 'string'
      ? new Date(message.updated_at)
      : message.updated_at
    : undefined;

  return Object.values(readList).some(
    ({ last_read }) => messageUpdatedAt && messageUpdatedAt < last_read,
  )
    ? MessageReadStatus.READ
    : MessageReadStatus.UNREAD;
};

const getLatestMessagePreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(params: {
  channel: Channel<StreamChatGenerics>;
  client: StreamChat<StreamChatGenerics>;
  readEvents: boolean;
  t: (key: string) => string;
  tDateTimeParser: TDateTimeParser;
  lastMessage?:
    | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
    | MessageResponse<StreamChatGenerics>;
}) => {
  const { channel, client, lastMessage, readEvents, t, tDateTimeParser } = params;

  const messages = channel.state.messages;

  if (!messages.length && !lastMessage) {
    return {
      created_at: '',
      messageObject: undefined,
      previews: [
        {
          bold: false,
          text: t('Nothing yet...'),
        },
      ],
      status: MessageReadStatus.NOT_SENT_BY_CURRENT_USER,
    };
  }
  // const message = lastMessage <==== works
  // const message = lastMessage || messages.length ? messages[messages.length - 1] : undefined; <==== culprit
  const message = lastMessage || messages.length ? messages[messages.length - 1] : undefined;

  return {
    created_at: getLatestMessageDisplayDate(message, tDateTimeParser),
    messageObject: message,
    previews: getLatestMessageDisplayText(channel, client, message, t),
    status: getLatestMessageReadStatus(channel, client, message, readEvents),
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  forceUpdate: number,
  lastMessage?:
    | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
    | MessageResponse<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { t, tDateTimeParser } = useTranslationContext();

  const channelConfigExists = typeof channel?.getConfig === 'function';

  const messages = []; //channel.state.messages;
  const message = messages.length ? messages[messages.length - 1] : undefined;

  const channelLastMessageString = `${lastMessage?.id || message?.id}${
    lastMessage?.updated_at || message?.updated_at
  }`;

  const [readEvents, setReadEvents] = useState(true);
  const [latestMessagePreview, setLatestMessagePreview] = useState<
    LatestMessagePreview<StreamChatGenerics>
  >({
    created_at: '',
    messageObject: undefined,
    previews: [
      {
        bold: false,
        text: '',
      },
    ],
    status: MessageReadStatus.NOT_SENT_BY_CURRENT_USER,
  });

  const readStatus = getLatestMessageReadStatus(
    channel,
    client,
    lastMessage || message,
    readEvents,
  );

  const text = useTranslatedMessage(lastMessage);
  const translatedLastMessage = { ...message, text };

  useEffect(() => {
    if (channelConfigExists) {
      const read_events = channel.getConfig()?.read_events;
      if (typeof read_events === 'boolean') {
        setReadEvents(read_events);
      }
    }
  }, [channelConfigExists]);

  // useEffect(
  //   () =>
  //     setLatestMessagePreview(
  //       getLatestMessagePreview({
  //         channel,
  //         client,
  //         lastMessage: translatedLastMessage,
  //         readEvents,
  //         t,
  //         tDateTimeParser,
  //       }),
  //     ),
  //   [channelLastMessageString, forceUpdate, readEvents, readStatus],
  // );

  return latestMessagePreview;
};
