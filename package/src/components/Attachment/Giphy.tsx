import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { GiphyIcon } from '../../icons';
import { Lightning } from '../../icons/Lightning';
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
import { makeImageCompatibleUrl } from '../../utils/utils';

const styles = StyleSheet.create({
  buttonContainer: { alignItems: 'center', borderTopWidth: 1, flex: 1, justifyContent: 'center' },
  cancel: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  container: {
    overflow: 'hidden',
    width: 270,
  },
  giphy: {
    borderRadius: 2,
    height: 170,
    width: 270,
  },
  giphyContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    justifyContent: 'center',
    width: 68,
  },
  giphyHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  giphyHeaderTitle: {
    fontSize: 14,
  },
  giphyMask: {
    bottom: 8,
    left: 8,
    position: 'absolute',
  },
  giphyMaskText: { fontSize: 13, fontWeight: '600' },
  header: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    width: '60%',
  },
  margin: {
    margin: 1,
  },
  row: { flexDirection: 'row' },
  selectionContainer: {
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: 272,
  },
  send: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  shuffle: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 16,
  },
  shuffleButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});

export type GiphyPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'handleAction' | 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'additionalTouchableProps'> & {
    attachment: Attachment<At>;
  };

const GiphyWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTouchableProps,
    attachment,
    handleAction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
  } = props;

  const { actions, image_url, thumb_url, title, type } = attachment;

  const {
    theme: {
      colors: { accent_blue, black, grey, grey_dark, grey_gainsboro, white },
      messageSimple: {
        giphy: {
          buttonContainer,
          cancel,
          container,
          giphy,
          giphyContainer,
          giphyHeaderText,
          giphyHeaderTitle,
          giphyMask,
          giphyMaskText,
          header,
          selectionContainer,
          send,
          shuffle,
        },
      },
    },
  } = useTheme('Giphy');

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
      <View style={[styles.header, header]}>
        <GiphyIcon />
        <Text style={[styles.giphyHeaderText, giphyHeaderText]}>Giphy</Text>
        <Text
          style={[styles.giphyHeaderTitle, giphyHeaderTitle, { color: grey_dark }]}
        >{`/giphy ${title}`}</Text>
      </View>
      <View style={styles.margin}>
        <Image
          resizeMode='cover'
          source={{ uri: makeImageCompatibleUrl(uri) }}
          style={[styles.giphy, giphy]}
        />
      </View>
      <View>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[2].name && actions?.[2].value && handleAction) {
                handleAction(actions[2].name, actions[2].value);
              }
            }}
            style={[
              styles.buttonContainer,
              { borderColor: grey_gainsboro, borderRightWidth: 1 },
              buttonContainer,
            ]}
          >
            <Text style={[styles.cancel, { color: grey }, cancel]}>{actions?.[2].text}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[1].name && actions?.[1].value && handleAction) {
                handleAction(actions[1].name, actions[1].value);
              }
            }}
            style={[
              styles.buttonContainer,
              { borderColor: grey_gainsboro, borderRightWidth: 1 },
              buttonContainer,
            ]}
          >
            <Text style={[styles.shuffle, { color: grey }, shuffle]}>{actions?.[1].text}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (actions?.[0].name && actions?.[0].value && handleAction) {
                handleAction(actions[0].name, actions[0].value);
              }
            }}
            style={[styles.buttonContainer, { borderColor: grey_gainsboro }, buttonContainer]}
          >
            <Text style={[styles.send, { color: accent_blue }, send]}>{actions?.[0].text}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : (
    <TouchableOpacity
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            emitter: 'giphy',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            emitter: 'giphy',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            emitter: 'giphy',
            event,
          });
        }
      }}
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
          <View style={[styles.giphyContainer, { backgroundColor: grey_dark }, giphyContainer]}>
            <Lightning height={16} pathFill={white} width={16} />
            <Text style={[styles.giphyMaskText, { color: white }, giphyMaskText]}>
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
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: GiphyPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    attachment: { actions: prevActions, image_url: prevImageUrl, thumb_url: prevThumbUrl },
  } = prevProps;
  const {
    attachment: { actions: nextActions, image_url: nextImageUrl, thumb_url: nextThumbUrl },
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

const MemoizedGiphy = React.memo(GiphyWithContext, areEqual) as typeof GiphyWithContext;

export type GiphyProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress' | 'onPressIn'> &
    Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'additionalTouchableProps'>
> & {
  attachment: Attachment<At>;
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
  Us extends UnknownType = DefaultUserType,
>(
  props: GiphyProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { handleAction, onLongPress, onPress, onPressIn, preventPress } =
    useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('AttachmentActions');
  const { additionalTouchableProps } =
    useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>('AttachmentActions');

  return (
    <MemoizedGiphy
      {...{
        additionalTouchableProps,
        handleAction,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
      }}
      {...props}
    />
  );
};

Giphy.displayName = 'Giphy{messageSimple{giphy}}';
