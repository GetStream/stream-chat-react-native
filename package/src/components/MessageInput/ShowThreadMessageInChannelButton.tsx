import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { MessageComposerState } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';
import { Check } from '../../icons';
import { primitives } from '../../theme';

const stateSelector = (state: MessageComposerState) => ({
  showReplyInChannel: state.showReplyInChannel,
});

export type ShowThreadMessageInChannelButtonWithContextProps = Pick<
  ThreadContextValue,
  'allowThreadMessagesInChannel'
> &
  Pick<TranslationContextValue, 't'> & { threadList?: ChannelContextValue['threadList'] };

export const ShowThreadMessageInChannelButtonWithContext = (
  props: ShowThreadMessageInChannelButtonWithContextProps,
) => {
  const styles = useStyles();
  const { allowThreadMessagesInChannel, t, threadList } = props;
  const messageComposer = useMessageComposer();
  const { showReplyInChannel } = useStateStore(messageComposer.state, stateSelector);

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

  const onPressHandler = useCallback(() => {
    messageComposer.toggleShowReplyInChannel();
  }, [messageComposer]);

  if (!threadList || !allowThreadMessagesInChannel) {
    return null;
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[styles.container, container]}
      testID='show-thread-message-in-channel-button'
    >
      <Pressable onPress={onPressHandler} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <View style={[styles.innerContainer, innerContainer]}>
          <View
            style={[
              styles.checkBox,
              showReplyInChannel
                ? {
                    backgroundColor: accent_blue,
                    borderColor: accent_blue,
                    ...checkBoxActive,
                  }
                : { borderColor: grey, ...checkBoxInactive },
            ]}
          >
            {showReplyInChannel && <Check width={16} height={16} stroke={white} {...check} />}
          </View>
          <Text style={[styles.text, { color: grey }, text]}>{t('Also send to channel')}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const areEqual = (
  prevProps: ShowThreadMessageInChannelButtonWithContextProps,
  nextProps: ShowThreadMessageInChannelButtonWithContextProps,
) => {
  const {
    allowThreadMessagesInChannel: prevAllowThreadMessagesInChannel,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    allowThreadMessagesInChannel: nextAllowThreadMessagesInChannel,
    t: nextT,
    threadList: nextThreadList,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const allowThreadMessagesInChannelEqual =
    prevAllowThreadMessagesInChannel === nextAllowThreadMessagesInChannel;
  if (!allowThreadMessagesInChannelEqual) {
    return false;
  }

  return true;
};

const MemoizedShowThreadMessageInChannelButton = React.memo(
  ShowThreadMessageInChannelButtonWithContext,
  areEqual,
) as typeof ShowThreadMessageInChannelButtonWithContext;

export type ShowThreadMessageInChannelButtonProps =
  Partial<ShowThreadMessageInChannelButtonWithContextProps>;

export const ShowThreadMessageInChannelButton = (props: ShowThreadMessageInChannelButtonProps) => {
  const { t } = useTranslationContext();
  const { allowThreadMessagesInChannel } = useThreadContext();
  const { threadList } = useChannelContext();

  return (
    <MemoizedShowThreadMessageInChannelButton
      {...{
        allowThreadMessagesInChannel,
        t,
        threadList,
      }}
      {...props}
    />
  );
};

ShowThreadMessageInChannelButton.displayName =
  'ShowThreadMessageInChannelButton{messageInput{showThreadMessageInChannelButton}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        checkBox: {
          alignItems: 'center',
          borderRadius: primitives.radiusSm,
          borderWidth: 1,
          height: 20,
          justifyContent: 'center',
          width: 20,
        },
        container: {
          flexDirection: 'row',
          paddingLeft: primitives.spacingSm,
          paddingBottom: primitives.spacingSm,
        },
        innerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        text: {
          fontSize: primitives.typographyFontSizeXs,
          lineHeight: primitives.typographyLineHeightTight,
          color: semantics.textTertiary,
          paddingLeft: 12,
        },
      }),
    [semantics.textTertiary],
  );
};
