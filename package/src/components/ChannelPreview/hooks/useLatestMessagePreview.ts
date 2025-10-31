import { useMemo } from 'react';

import { TFunction } from 'i18next';
import type {
  AttachmentManagerState,
  Channel,
  DraftMessage,
  LocalMessage,
  PollState,
  PollVote,
  StreamChat,
  TextComposerState,
  UserResponse,
} from 'stream-chat';

import { MessageDeliveryStatus, useMessageDeliveryStatus } from './useMessageDeliveryStatus';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../../hooks';
import { useTranslatedMessage } from '../../../hooks/useTranslatedMessage';

import { stringifyMessage } from '../../../utils/utils';

export type LatestMessagePreview = {
  messageObject: LocalMessage | undefined;
  previews: {
    bold: boolean;
    text: string;
    draft?: boolean;
  }[];
  status?: MessageDeliveryStatus;
  created_at?: string | Date;
};

export type LatestMessagePreviewSelectorReturnType = {
  createdBy?: UserResponse | null;
  latestVotesByOption?: Record<string, PollVote[]>;
  name?: string;
};

const selector = (nextValue: PollState): LatestMessagePreviewSelectorReturnType => ({
  createdBy: nextValue.created_by,
  latestVotesByOption: nextValue.latest_votes_by_option,
  name: nextValue.name,
});

const getMessageSenderName = (
  message: LocalMessage | undefined,
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

const getMentionUsers = (mentionedUser: UserResponse[] | undefined) => {
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

const getLatestMessageDisplayText = (
  channel: Channel,
  client: StreamChat,
  draftMessage: DraftMessage | undefined,
  message: LocalMessage | undefined,
  t: (key: string) => string,
  pollState: LatestMessagePreviewSelectorReturnType | undefined,
) => {
  if (!message) {
    return [{ bold: false, text: t('Nothing yet...') }];
  }
  const isMessageTypeDeleted = message.type === 'deleted';
  if (isMessageTypeDeleted) {
    return [{ bold: false, text: t('Message deleted') }];
  }
  const currentUserId = client?.userID;
  const members = Object.keys(channel.state.members);

  const messageSender = getMessageSenderName(message, currentUserId, t, members.length);
  const messageSenderText = messageSender
    ? `${messageSender === t('You') ? '' : '@'}${messageSender}: `
    : '';
  const boldOwner = messageSenderText.includes('@');
  if (draftMessage) {
    if (draftMessage.attachments?.length) {
      return [
        { bold: true, draft: true, text: 'Draft:' },
        { bold: false, text: t('🏙 Attachment...') },
      ];
    }
    if (draftMessage.text) {
      return [
        { bold: true, draft: true, text: 'Draft:' },
        { bold: false, text: draftMessage.text },
      ];
    }
  }
  // Location messages
  if (message.shared_location) {
    return [
      { bold: false, text: '📍' },
      { bold: false, text: t('Location') },
    ];
  }

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
  DELIVERED = 3,
}

const getLatestMessagePreview = (params: {
  channel: Channel;
  client: StreamChat;
  draftMessage?: DraftMessage;
  pollState: LatestMessagePreviewSelectorReturnType | undefined;
  /**
   * @deprecated This parameter is no longer used and will be removed in the next major release.
   */
  readEvents?: boolean;
  lastMessage?: LocalMessage;
  status?: MessageDeliveryStatus;
  t: TFunction;
}) => {
  const { channel, client, draftMessage, lastMessage, pollState, status, t } = params;

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
      status: MessageDeliveryStatus.NOT_SENT_BY_CURRENT_USER,
    };
  }

  const channelStateLastMessage = messages.length ? messages[messages.length - 1] : undefined;

  const message = lastMessage !== undefined ? lastMessage : channelStateLastMessage;

  return {
    created_at: message?.created_at,
    messageObject: message,
    previews: getLatestMessageDisplayText(channel, client, draftMessage, message, t, pollState),
    status,
  };
};

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

/**
 * Hook to set the display preview for latest message on channel.
 *
 * FIXME: This hook is very poorly implemented and needs to be refactored with granular hooks
 * to avoid unnecessary re-renders and to make the code more readable.
 *
 * @param {*} channel Channel object
 *
 * @returns {object} latest message preview e.g.. { text: 'this was last message ...', created_at: '11/12/2020', messageObject: { originalMessageObject } }
 */
export const useLatestMessagePreview = (
  channel: Channel,
  forceUpdate: number,
  lastMessage?: LocalMessage,
) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const { text: draftText } = useStateStore(
    channel.messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const { attachments } = useStateStore(
    channel.messageComposer.attachmentManager.state,
    stateSelector,
  );

  const draftMessage: DraftMessage | undefined = useMemo(
    () =>
      !channel.messageComposer.compositionIsEmpty
        ? {
            attachments,
            id: channel.messageComposer.id,
            text: draftText,
          }
        : undefined,
    [channel.messageComposer, attachments, draftText],
  );

  const channelConfigExists = typeof channel?.getConfig === 'function';

  const translatedLastMessage = useTranslatedMessage(lastMessage);

  const channelLastMessageString = translatedLastMessage
    ? stringifyMessage({ message: translatedLastMessage })
    : '';

  const readEvents = useMemo(() => {
    if (!channelConfigExists) {
      return true;
    }
    const read_events = !channel.disconnected && !!channel?.id && channel.getConfig()?.read_events;
    if (typeof read_events !== 'boolean') {
      return true;
    }
    return read_events;
  }, [channelConfigExists, channel]);

  const { status } = useMessageDeliveryStatus({
    channel,
    isReadEventsEnabled: readEvents,
    lastMessage: lastMessage as LocalMessage,
  });

  const pollId = lastMessage?.poll_id ?? '';
  const poll = client.polls.fromState(pollId);
  const pollState: LatestMessagePreviewSelectorReturnType =
    useStateStore(poll?.state, selector) ?? {};
  const { createdBy, latestVotesByOption, name } = pollState;

  const latestMessagePreview = useMemo(() => {
    return getLatestMessagePreview({
      channel,
      client,
      draftMessage,
      lastMessage: translatedLastMessage,
      pollState,
      status,
      t,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelLastMessageString,
    status,
    draftMessage,
    forceUpdate,
    latestVotesByOption,
    createdBy,
    name,
  ]);

  return latestMessagePreview;
};
