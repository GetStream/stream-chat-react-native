import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Check } from '../../icons';
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

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

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
      <View style={[styles.container, container]}>
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: ShowThreadMessageInChannelButtonProps,
) => {
  const { t } = useTranslationContext();
  const { allowThreadMessagesInChannel } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { sendThreadMessageInChannel, setSendThreadMessageInChannel } =
    useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

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
