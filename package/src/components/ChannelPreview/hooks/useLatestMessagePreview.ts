import { useEffect, useState } from 'react';

import { TFunction } from 'i18next';
import type {
  Channel,
  ChannelState,
  MessageResponse,
  PollState,
  PollVote,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../../hooks';
import { useTranslatedMessage } from '../../../hooks/useTranslatedMessage';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { stringifyMessage } from '../../../utils/utils';

type LatestMessage<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> =
  | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
  | MessageResponse<StreamChatGenerics>;

export type LatestMessagePreview<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  messageObject: LatestMessage<StreamChatGenerics> | undefined;
  previews: {
    bold: boolean;
    text: string;
  }[];
  status: number;
  created_at?: string | Date;
};

export type LatestMessagePreviewSelectorReturnType = {
  createdBy?: UserResponse | null;
  latestVotesByOption?: Record<string, PollVote[]>;
  name?: string;
};

const selector = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  nextValue: PollState<StreamChatGenerics>,
): LatestMessagePreviewSelectorReturnType => ({
  createdBy: nextValue.created_by,
  latestVotesByOption: nextValue.latest_votes_by_option,
  name: nextValue.name,
});

const getMessageSenderName = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: LatestMessage<StreamChatGenerics> | undefined,
  currentUserId: string | undefined,
  t: (key: string) => string,
  membersLength: number,
) => {
  if (message?.user?.id === currentUserId) {
    return t('You');
  }

  if (membersLength > 2) {
    return message?.user?.name || message?.user?.username || message?.user?.id || '';
  }

  return '';
};

const getMentionUsers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  mentionedUser: UserResponse<StreamChatGenerics>[] | undefined,
) => {
  if (Array.isArray(mentionedUser)) {
    const mentionUserString = mentionedUser.reduce((acc, cur) => {
      const userName = cur.name || cur.id || '';
      if (userName) {
        acc += `${acc.length ? '|' : ''}@${userName}`;
      }
      return acc;
    }, '');

    // escape special characters
    return mentionUserString.replace(/[.*+?^${}()|[\]\\]/g, function (match) {
      return '\\' + match;
    });
  }

  return '';
};

const getLatestMessageDisplayText = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
  message: LatestMessage<StreamChatGenerics> | undefined,
  t: (key: string) => string,
  pollState: LatestMessagePreviewSelectorReturnType | undefined,
) => {
  if (!message) return [{ bold: false, text: t('Nothing yet...') }];
  const isMessageTypeDeleted = message.type === 'deleted';
  if (isMessageTypeDeleted) return [{ bold: false, text: t('Message deleted') }];
  const currentUserId = client?.userID;
  const members = Object.keys(channel.state.members);

  const messageSender = getMessageSenderName(message, currentUserId, t, members.length);
  const messageSenderText = messageSender
    ? `${messageSender === t('You') ? '' : '@'}${messageSender}: `
    : '';
  const boldOwner = messageSenderText.includes('@');
  if (message.text) {
    // rough guess optimization to limit string preview to max 100 characters
    const shortenedText = message.text.substring(0, 100).replace(/\n/g, ' ');
    const mentionedUsers = getMentionUsers(message.mentioned_users);
    const regEx = new RegExp(`^(${mentionedUsers})`);
    return [
      { bold: boldOwner, text: messageSenderText },
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
      { bold: boldOwner, text: messageSenderText },
      { bold: false, text: `/${message.command}` },
    ];
  }
  if (message.attachments?.length) {
    return [
      { bold: boldOwner, text: messageSenderText },
      { bold: false, text: t('🏙 Attachment...') },
    ];
  }
  if (message.poll_id && pollState) {
    const { createdBy, latestVotesByOption, name } = pollState;
    let latestVotes;
    if (latestVotesByOption) {
      latestVotes = Object.values(latestVotesByOption)
        .map((votes) => votes?.[0])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    let previewAction = 'created';
    let previewUser = createdBy;
    if (latestVotes && latestVotes.length && latestVotes[0]?.user) {
      previewAction = 'voted';
      previewUser = latestVotes[0]?.user;
    }
    const previewMessage = `${
      client.userID === previewUser?.id ? 'You' : previewUser?.name
    } ${previewAction}: ${name}`;
    return [
      { bold: false, text: '📊 ' },
      { bold: false, text: previewMessage },
    ];
  }
  return [
    { bold: boldOwner, text: messageSenderText },
    { bold: false, text: t('Empty message...') },
  ];
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

  const readList = { ...channel.state.read };
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
  pollState: LatestMessagePreviewSelectorReturnType | undefined;
  readEvents: boolean;
  t: TFunction;
  lastMessage?:
    | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
    | MessageResponse<StreamChatGenerics>;
}) => {
  const { channel, client, lastMessage, pollState, readEvents, t } = params;

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

  const channelStateLastMessage = messages.length ? messages[messages.length - 1] : undefined;

  const message = lastMessage !== undefined ? lastMessage : channelStateLastMessage;

  return {
    created_at: message?.created_at,
    messageObject: message,
    previews: getLatestMessageDisplayText(channel, client, message, t, pollState),
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
  const { t } = useTranslationContext();

  const channelConfigExists = typeof channel?.getConfig === 'function';

  const translatedLastMessage = useTranslatedMessage<StreamChatGenerics>(lastMessage);

  const channelLastMessageString = translatedLastMessage
    ? stringifyMessage(translatedLastMessage)
    : '';

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

  const readStatus = getLatestMessageReadStatus(channel, client, translatedLastMessage, readEvents);

  useEffect(() => {
    if (channelConfigExists) {
      const read_events =
        !channel.disconnected && !!channel?.id && channel.getConfig()?.read_events;
      if (typeof read_events === 'boolean') {
        setReadEvents(read_events);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelConfigExists]);

  const pollId = lastMessage?.poll_id ?? '';
  const poll = client.polls.fromState(pollId);
  const pollState: LatestMessagePreviewSelectorReturnType =
    useStateStore(poll?.state, selector) ?? {};
  const { createdBy, latestVotesByOption, name } = pollState;

  useEffect(
    () =>
      setLatestMessagePreview(
        getLatestMessagePreview({
          channel,
          client,
          lastMessage: translatedLastMessage,
          pollState,
          readEvents,
          t,
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelLastMessageString,
      forceUpdate,
      readEvents,
      readStatus,
      latestVotesByOption,
      createdBy,
      name,
    ],
  );

  return latestMessagePreview;
};
