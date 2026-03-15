import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Attachment } from 'stream-chat';

import { GiphyImage } from './GiphyImage';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

import { EyeOpen } from '../../../icons/EyeOpen';
import { primitives } from '../../../theme';

export type GiphyPropsWithContext = Pick<
  MessageContextValue,
  'handleAction' | 'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<MessagesContextValue, 'additionalPressableProps' | 'giphyVersion'> & {
    attachment: Attachment;
  };

const GiphyWithContext = (props: GiphyPropsWithContext) => {
  const {
    additionalPressableProps,
    attachment,
    giphyVersion,
    handleAction,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
  } = props;

  const { actions, image_url, thumb_url } = attachment;

  const { t } = useTranslationContext();

  const {
    theme: {
      messageSimple: {
        giphy: {
          actionButtonContainer,
          actionButton,
          actionButtonText,
          container,
          giphyHeaderText,
          header,
        },
      },
      semantics,
    },
  } = useTheme();

  const styles = useStyles();

  const uri = image_url || thumb_url;

  if (!uri) {
    return null;
  }

  return actions ? (
    <View style={[styles.container, container]} testID='giphy-action-attachment'>
      <View style={[styles.header, header]}>
        <EyeOpen height={16} width={16} fill={semantics.chatTextOutgoing} />
        <Text style={[styles.headerText, giphyHeaderText]}>{t('Only visible to you')}</Text>
      </View>
      <GiphyImage attachment={attachment} giphyVersion={giphyVersion} preview />
      <View style={[styles.actionButtonContainer, actionButtonContainer]}>
        {actions.map((action) => {
          return (
            <Pressable
              key={action.value}
              onPress={() => {
                if (action?.name && action?.value && handleAction) {
                  handleAction(action.name, action.value);
                }
              }}
              style={[styles.actionButton, actionButton]}
              testID={`${action.value}-action-button`}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.actionButtonText,
                  {
                    color:
                      action.text === 'Send'
                        ? semantics.buttonPrimaryText
                        : semantics.buttonSecondaryText,
                  },
                  actionButtonText,
                ]}
              >
                {action.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  ) : (
    <Pressable
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
      testID='giphy-attachment'
      style={styles.container}
      {...additionalPressableProps}
    >
      <GiphyImage attachment={attachment} giphyVersion={giphyVersion} />
    </Pressable>
  );
};

const areEqual = (prevProps: GiphyPropsWithContext, nextProps: GiphyPropsWithContext) => {
  const {
    attachment: { actions: prevActions, image_url: prevImageUrl, thumb_url: prevThumbUrl },
    giphyVersion: prevGiphyVersion,
  } = prevProps;
  const {
    attachment: { actions: nextActions, image_url: nextImageUrl, thumb_url: nextThumbUrl },
    giphyVersion: nextGiphyVersion,
  } = nextProps;

  const imageUrlEqual = prevImageUrl === nextImageUrl;
  if (!imageUrlEqual) {
    return false;
  }

  const thumbUrlEqual = prevThumbUrl === nextThumbUrl;
  if (!thumbUrlEqual) {
    return false;
  }

  const actionsEqual =
    Array.isArray(prevActions) === Array.isArray(nextActions) &&
    ((Array.isArray(prevActions) &&
      Array.isArray(nextActions) &&
      prevActions.length === nextActions.length) ||
      prevActions === nextActions);
  if (!actionsEqual) {
    return false;
  }

  const giphyVersionEqual = prevGiphyVersion === nextGiphyVersion;
  if (!giphyVersionEqual) {
    return false;
  }

  return true;
};

const MemoizedGiphy = React.memo(GiphyWithContext, areEqual) as typeof GiphyWithContext;

export type GiphyProps = Partial<GiphyPropsWithContext> & {
  attachment: Attachment;
};

/**
 * UI component for card in attachments.
 */
export const Giphy = (props: GiphyProps) => {
  const { handleAction, onLongPress, onPress, onPressIn, preventPress } = useMessageContext();
  const { additionalPressableProps, giphyVersion } = useMessagesContext();

  return (
    <MemoizedGiphy
      {...{
        additionalPressableProps,
        giphyVersion,
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.chatBgOutgoing,
        borderRadius: primitives.radiusLg,
        maxWidth: 256, // TODO: Not sure how to fix this
        overflow: 'hidden',
      },
      actionButtonContainer: {
        flexDirection: 'row',
        gap: primitives.spacingXs,
      },
      actionButton: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingVertical: primitives.spacingSm,
      },
      actionButtonText: {
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        color: semantics.buttonSecondaryText,
      },
      header: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: primitives.spacingSm,
        paddingVertical: primitives.spacingXs,
        gap: primitives.spacingXs,
      },
      headerText: {
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
