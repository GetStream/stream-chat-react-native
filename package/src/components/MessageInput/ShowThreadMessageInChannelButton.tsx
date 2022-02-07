import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { Check } from '../../icons';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  checkBox: {
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  container: {
    flexDirection: 'row',
    marginHorizontal: 2,
    marginTop: 8,
  },
  innerContainer: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 13,
    marginLeft: 12,
  },
});

export type ShowThreadMessageInChannelButtonWithContextProps = Pick<
  MessageInputContextValue,
  'sendThreadMessageInChannel' | 'setSendThreadMessageInChannel'
> &
  Pick<ThreadContextValue, 'allowThreadMessagesInChannel'> &
  Pick<TranslationContextValue, 't'> & {
    threadList?: boolean;
  };

export const ShowThreadMessageInChannelButtonWithContext: React.FC<ShowThreadMessageInChannelButtonWithContextProps> =
  (props) => {
    const {
      allowThreadMessagesInChannel,
      sendThreadMessageInChannel,
      setSendThreadMessageInChannel,
      t,
      threadList,
    } = props;

    const {
      theme: {
        colors: { accent_blue, grey, white },
        messageInput: {
          showThreadMessageInChannelButton: {
            check,
            checkBoxActive,
            checkBoxInactive,
            container,
            innerContainer,
            text,
          },
        },
      },
    } = useTheme();

    if (!threadList || !allowThreadMessagesInChannel) {
      return null;
    }

    return (
      <View style={[styles.container, container]} testID='show-thread-message-in-channel-button'>
        <TouchableOpacity
          onPress={() => setSendThreadMessageInChannel((prevSendInChannel) => !prevSendInChannel)}
        >
          <View style={[styles.innerContainer, innerContainer]}>
            <View
              style={[
                styles.checkBox,
                sendThreadMessageInChannel
                  ? {
                      backgroundColor: accent_blue,
                      borderColor: accent_blue,
                      ...checkBoxActive,
                    }
                  : { borderColor: grey, ...checkBoxInactive },
              ]}
            >
              {sendThreadMessageInChannel && (
                <Check height={16} pathFill={white} width={16} {...check} />
              )}
            </View>
            <Text style={[styles.text, { color: grey }, text]}>{t('Also send to channel')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

const areEqual = (
  prevProps: ShowThreadMessageInChannelButtonWithContextProps,
  nextProps: ShowThreadMessageInChannelButtonWithContextProps,
) => {
  const {
    allowThreadMessagesInChannel: prevAllowThreadMessagesInChannel,
    sendThreadMessageInChannel: prevSendThreadMessageInChannel,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    allowThreadMessagesInChannel: nextAllowThreadMessagesInChannel,
    sendThreadMessageInChannel: nexSendThreadMessageInChannel,
    t: nextT,
    threadList: nextThreadList,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const sendThreadMessageInChannelEqual =
    prevSendThreadMessageInChannel === nexSendThreadMessageInChannel;
  if (!sendThreadMessageInChannelEqual) return false;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) return false;

  const allowThreadMessagesInChannelEqual =
    prevAllowThreadMessagesInChannel === nextAllowThreadMessagesInChannel;
  if (!allowThreadMessagesInChannelEqual) return false;

  return true;
};

const MemoizedShowThreadMessageInChannelButton = React.memo(
  ShowThreadMessageInChannelButtonWithContext,
  areEqual,
) as typeof ShowThreadMessageInChannelButtonWithContext;

export type ShowThreadMessageInChannelButtonProps =
  Partial<ShowThreadMessageInChannelButtonWithContextProps>;

export const ShowThreadMessageInChannelButton = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: ShowThreadMessageInChannelButtonProps,
) => {
  const { t } = useTranslationContext();
  const { allowThreadMessagesInChannel } = useThreadContext<StreamChatClient>();
  const { sendThreadMessageInChannel, setSendThreadMessageInChannel } =
    useMessageInputContext<StreamChatClient>();

  return (
    <MemoizedShowThreadMessageInChannelButton
      {...{
        allowThreadMessagesInChannel,
        sendThreadMessageInChannel,
        setSendThreadMessageInChannel,
        t,
      }}
      {...props}
    />
  );
};

ShowThreadMessageInChannelButton.displayName =
  'ShowThreadMessageInChannelButton{messageInput{showThreadMessageInChannelButton}}';
