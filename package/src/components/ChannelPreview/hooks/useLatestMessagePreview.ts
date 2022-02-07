import { useEffect, useState } from 'react';

import type {
  Channel,
  ChannelState,
  ExtendableGenerics,
  MessageResponse,
  StreamChat,
} from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  isDayOrMoment,
  TDateTimeParser,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type LatestMessage<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> =
  | ReturnType<ChannelState<StreamChatClient>['formatMessage']>
  | MessageResponse<StreamChatClient>;

export type LatestMessagePreview<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  created_at: string | number | Date;
  messageObject: LatestMessage<StreamChatClient> | undefined;
  previews: {
    bold: boolean;
    text: string;
  }[];
  status: number;
};

const getLatestMessageDisplayText = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatClient>,
  client: StreamChat<StreamChatClient>,
  message: LatestMessage<StreamChatClient> | undefined,
  t: (key: string) => string,
) => {
  if (!message) return [{ bold: false, text: t('Nothing yet...') }];
  const isMessageTypeDeleted = message.type === 'deleted';
  if (isMessageTypeDeleted) return [{ bold: false, text: t('Message deleted') }];
  const currentUserId = client.userID;
  const messageOwnerId = message.user?.id;
  const members = Object.keys(channel.state.members);
  const owner =
    messageOwnerId === currentUserId
      ? t('You')
      : members.length > 2
      ? message.user?.name || message.user?.username || message.user?.id || ''
      : '';
  const ownerText = owner ? `${owner === t('You') ? '' : '@'}${owner}: ` : '';
  const boldOwner = ownerText.includes('@');
  if (message.text) {
    // rough guess optimization to limit string preview to max 100 characters
    const shortenedText = message.text.substring(0, 100).replace(/\n/g, ' ');
    const mentionedUsers = Array.isArray(message.mentioned_users)
      ? message.mentioned_users.reduce((acc, cur) => {
          const userName = cur.name || cur.id || '';
          if (userName) {
            acc += `${acc.length ? '|' : ''}@${userName}`;
          }
          return acc;
        }, '')
      : '';
    const regEx = new RegExp(`^(${mentionedUsers})`);
    return [
      { bold: boldOwner, text: ownerText },
      ...shortenedText.split('').reduce(
        (acc, cur, index) => {
          if (cur === '@' && mentionedUsers && regEx.test(shortenedText.substring(index))) {
            acc.push({ bold: true, text: cur });
          } else if (mentionedUsers && regEx.test(acc[acc.length - 1].text)) {
            acc.push({ bold: false, text: cur });
          } else {
            acc[acc.length - 1].text += cur;
          }
          return acc;
        },
        [{ bold: false, text: '' }],
      ),
    ];
  }
  if (message.command) {
    return [
      { bold: boldOwner, text: ownerText },
      { bold: false, text: `/${message.command}` },
    ];
  }
  if (message.attachments?.length) {
    return [
      { bold: boldOwner, text: ownerText },
      { bold: false, text: t('🏙 Attachment...') },
    ];
  }
  return [
    { bold: boldOwner, text: ownerText },
    { bold: false, text: t('Empty message...') },
  ];
};

const getLatestMessageDisplayDate = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatClient> | undefined,
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

/**
 * set up enum
 * 0 = latest message is not current user's message
 * 1 = nobody has read latest message which is the current user's message
 * 2 = someone has read latest message which is the current user's message
 */
const getLatestMessageReadStatus = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatClient>,
  client: StreamChat<StreamChatClient>,
  message: LatestMessage<StreamChatClient> | undefined,
  readEvents: boolean,
) => {
  const currentUserId = client.userID;
  if (!message || currentUserId !== message.user?.id || readEvents === false) return 0;

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
    ? 2
    : 1;
};

const getLatestMessagePreview = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(params: {
  channel: Channel<StreamChatClient>;
  client: StreamChat<StreamChatClient>;
  readEvents: boolean;
  t: (key: string) => string;
  tDateTimeParser: TDateTimeParser;
  lastMessage?:
    | ReturnType<ChannelState<StreamChatClient>['formatMessage']>
    | MessageResponse<StreamChatClient>;
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
      status: 0,
    };
  }
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatClient>,
  forceUpdate: number,
  lastMessage?:
    | ReturnType<ChannelState<StreamChatClient>['formatMessage']>
    | MessageResponse<StreamChatClient>,
) => {
  const { client } = useChatContext<StreamChatClient>();
  const { t, tDateTimeParser } = useTranslationContext();

  const channelConfigExists = typeof channel?.getConfig === 'function';

  const messages = channel.state.messages;
  const message = messages.length ? messages[messages.length - 1] : undefined;

  const channelLastMessageString = `${lastMessage?.id || message?.id}${
    lastMessage?.updated_at || message?.updated_at
  }`;

  const [readEvents, setReadEvents] = useState(true);
  const [latestMessagePreview, setLatestMessagePreview] = useState<
    LatestMessagePreview<StreamChatClient>
  >({
    created_at: '',
    messageObject: undefined,
    previews: [
      {
        bold: false,
        text: '',
      },
    ],
    status: 0,
  });

  const readStatus = getLatestMessageReadStatus(
    channel,
    client,
    lastMessage || message,
    readEvents,
  );

  useEffect(() => {
    if (channelConfigExists) {
      const read_events = channel.getConfig()?.read_events;
      if (typeof read_events === 'boolean') {
        setReadEvents(read_events);
      }
    }
  }, [channelConfigExists]);

  useEffect(
    () =>
      setLatestMessagePreview(
        getLatestMessagePreview({
          channel,
          client,
          lastMessage,
          readEvents,
          t,
          tDateTimeParser,
        }),
      ),
    [channelLastMessageString, forceUpdate, readEvents, readStatus],
  );

  return latestMessagePreview;
};
