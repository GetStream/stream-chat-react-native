import React from 'react';
import {
  GestureResponderEvent,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Left } from '../../icons/Left';
import { Lightning } from '../../icons/Lightning';
import { Right } from '../../icons/Right';
import { makeImageCompatibleUrl } from '../../utils/utils';

import type { Attachment } from 'stream-chat';

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
  cancel: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  cancelContainer: {
    alignItems: 'center',
    borderRightWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    overflow: 'hidden',
    width: 256,
  },
  giphy: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 140,
  },
  giphyContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    justifyContent: 'center',
    width: 68,
  },
  giphyMask: {
    bottom: 8,
    left: 8,
    position: 'absolute',
  },
  giphyText: { fontSize: 11, fontWeight: '600' },
  margin: {
    margin: 8,
  },
  row: { flexDirection: 'row' },
  selectionContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: 250,
  },
  selector: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  send: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  sendContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  shuffleButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export type GiphyPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'handleAction' | 'onLongPress'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'additionalTouchableProps'
  > & {
    attachment: Attachment<At>;
    onPressIn?: (
      event: GestureResponderEvent,
      defaultOnPress?: () => void,
    ) => void;
  };

const GiphyWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    attachment,
    handleAction,
    onLongPress,
    onPressIn,
  } = props;

  const { actions, image_url, thumb_url, title, type } = attachment;

  const {
    theme: {
      colors: { accent_blue, black, border, grey, overlay_dark, white },
      messageSimple: {
        giphy: {
          cancel,
          cancelContainer,
          container,
          giphy,
          giphyContainer,
          giphyMask,
          giphyText,
          selectionContainer,
          selector,
          send,
          sendContainer,
          shuffleButton,
          title: titleStyle,
        },
      },
    },
  } = useTheme();

  const uri = image_url || thumb_url;

  if (!uri) return null;

  return actions ? (
    <View
      style={[
        styles.selectionContainer,
        { backgroundColor: white, borderColor: `${black}0D` },
        selectionContainer,
      ]}
    >
      <View style={styles.margin}>
        <Image
          resizeMode='cover'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphy]}
        />
        <View style={[styles.giphyMask, giphyMask]}>
          <View
            style={[
              styles.giphyContainer,
              { backgroundColor: overlay_dark },
              giphyContainer,
            ]}
          >
            <Lightning height={16} pathFill={white} width={16} />
            <Text style={[styles.giphyText, { color: white }, giphyText]}>
              {type?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View>
        <View
          style={[styles.selector, { borderBottomColor: border }, selector]}
        >
          <TouchableOpacity
            onPress={() => handleAction('image_action', 'shuffle')}
            style={[
              styles.shuffleButton,
              { borderColor: border },
              shuffleButton,
            ]}
          >
            <Left />
          </TouchableOpacity>
          <Text
            style={[styles.title, { color: black }, titleStyle]}
          >{`"${title}"`}</Text>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[1].name && actions?.[1].value && handleAction) {
                handleAction(actions[1].name, actions[1].value);
              }
            }}
            style={[styles.shuffleButton, shuffleButton]}
          >
            <Right />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[2].name && actions?.[2].value && handleAction) {
                handleAction(actions[2].name, actions[2].value);
              }
            }}
            style={[
              styles.cancelContainer,
              { borderRightColor: border },
              cancelContainer,
            ]}
          >
            <Text style={[styles.cancel, { color: grey }, cancel]}>
              {actions?.[2].text}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[0].name && actions?.[0].value && handleAction) {
                handleAction(actions[0].name, actions[0].value);
              }
            }}
            style={[styles.sendContainer, sendContainer]}
          >
            <Text style={[styles.send, { color: accent_blue }, send]}>
              {actions?.[0].text}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      style={[styles.container, container]}
      testID='giphy-attachment'
      {...additionalTouchableProps}
    >
      <View>
        <Image
          resizeMode='cover'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphy]}
        />
        <View style={[styles.giphyMask, giphyMask]}>
          <View
            style={[
              styles.giphyContainer,
              { backgroundColor: overlay_dark },
              giphyContainer,
            ]}
          >
            <Lightning height={16} pathFill={white} width={16} />
            <Text style={[styles.giphyText, { color: white }, giphyText]}>
              {type?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    attachment: {
      actions: prevActions,
      image_url: prevImageUrl,
      thumb_url: prevThumbUrl,
    },
  } = prevProps;
  const {
    attachment: {
      actions: nextActions,
      image_url: nextImageUrl,
      thumb_url: nextThumbUrl,
    },
  } = nextProps;

  const imageUrlEqual = prevImageUrl === nextImageUrl;
  if (!imageUrlEqual) return false;

  const thumbUrlEqual = prevThumbUrl === nextThumbUrl;
  if (!thumbUrlEqual) return false;

  const actionsEqual =
    Array.isArray(prevActions) === Array.isArray(nextActions) &&
    ((Array.isArray(prevActions) &&
      Array.isArray(nextActions) &&
      prevActions.length === nextActions.length) ||
      prevActions === nextActions);
  if (!actionsEqual) return false;

  return true;
};

const MemoizedGiphy = React.memo(
  GiphyWithContext,
  areEqual,
) as typeof GiphyWithContext;

export type GiphyProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress'> &
    Pick<
      MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'additionalTouchableProps'
    >
> & {
  attachment: Attachment<At>;
  onPressIn?: (
    event: GestureResponderEvent,
    defaultOnPress?: () => void,
  ) => void;
};

/**
 * UI component for card in attachments.
 */
export const Giphy = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: GiphyProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { handleAction, onLongPress } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const {
    additionalTouchableProps,
    onPressInMessage: onPressIn,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedGiphy
      {...{
        additionalTouchableProps,
        handleAction,
        onLongPress,
        onPressIn,
      }}
      {...props}
    />
  );
};

Giphy.displayName = 'Giphy{messageSimple{giphy}}';
