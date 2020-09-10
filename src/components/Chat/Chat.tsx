import React, { PropsWithChildren, useState } from 'react';
import Dayjs from 'dayjs';
import type {
  Channel,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

import { useIsOnline } from './hooks/useIsOnline';
import { useStreami18n } from './hooks/useStreami18n';

import { ChatProvider } from '../../contexts/ChatContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../contexts/TranslationContext';
import { themed } from '../../styles/theme';
import type { Streami18n } from '../../utils/Streami18n';

type Props<
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
> = {
  /** The StreamChat client object */
  client: StreamChat<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >;
  /**
   * Instance of Streami18n class should be provided to Chat component to enable internationalization.
   *
   * Stream provides following list of in-built translations:
   * 1. English (en)
   * 2. Dutch (nl)
   * 3. ...
   * 4. ...
   *
   * Simplest way to start using chat components in one of the in-built languages would be following:
   *
   * ```
   * const i18n = new Streami18n('nl');
   * <Chat client={chatClient} i18nInstance={i18n}>
   *  ...
   * </Chat>
   * ```
   *
   * If you would like to override certain keys in in-built translation.
   * UI will be automatically updated in this case.
   *
   * ```
   * const i18n = new Streami18n('nl');
   *
   * i18n.registerTranslation('nl', {
   *  'Nothing yet...': 'Nog Niet ...',
   *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
   * });
   *
   * <Chat client={chatClient} i18nInstance={i18n}>
   *  ...
   * </Chat>
   * ```
   *
   * You can use the same function to add whole new language.
   *
   * ```
   * const i18n = new Streami18n('it');
   *
   * i18n.registerTranslation('it', {
   *  'Nothing yet...': 'Non ancora ...',
   *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} a {{ secondUser }} stanno scrivendo...',
   * });
   *
   * // Make sure to call setLanguage to reflect new language in UI.
   * i18n.setLanguage('it');
   * <Chat client={chatClient} i18nInstance={i18n}>
   *  ...
   * </Chat>
   * ```
   */
  i18nInstance?: typeof Streami18n;
  logger?: (message?: string) => void;
};

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - channel (the currently active channel)
 * - client (the client connection)
 * - connectionRecovering (whether or not websocket is reconnecting)
 * - isOnline (whether or not set user is active)
 * - logger (custom logging function)
 * - setActiveChannel (function to set the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ../docs/Chat.md
 */
const Chat = <
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
>(
  props: PropsWithChildren<
    Props<
      ChannelType,
      UserType,
      MessageType,
      AttachmentType,
      ReactionType,
      EventType,
      CommandType
    >
  >,
) => {
  const { children, client, i18nInstance, logger = () => null } = props;

  const [channel, setChannel] = useState<
    Channel<
      AttachmentType,
      ChannelType,
      EventType,
      MessageType,
      ReactionType,
      UserType,
      CommandType
    >
  >();
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date | Dayjs.Dayjs) =>
      Dayjs(input),
  });

  // Setup translators
  useStreami18n({ i18nInstance, setTranslators });

  // Setup connection event listeners
  const { connectionRecovering, isOnline } = useIsOnline({
    client,
  });

  const setActiveChannel = (
    newChannel?: Channel<
      AttachmentType,
      ChannelType,
      EventType,
      MessageType,
      ReactionType,
      UserType,
      CommandType
    >,
  ) => setChannel(newChannel);

  if (!translators.t) return null;

  const chatContext = {
    channel,
    client,
    connectionRecovering,
    isOnline,
    logger,
    setActiveChannel,
  };

  return (
    <ChatProvider<
      ChannelType,
      UserType,
      MessageType,
      AttachmentType,
      ReactionType,
      EventType,
      CommandType
    >
      value={chatContext}
    >
      <TranslationProvider value={translators}>{children}</TranslationProvider>
    </ChatProvider>
  );
};

Chat.themePath = '';

export default themed(Chat);
