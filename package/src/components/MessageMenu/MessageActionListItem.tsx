import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { closeOverlay, scheduleActionOnClose } from '../../state-store';
import { primitives } from '../../theme';

export type ActionType =
  | 'banUser'
  | 'blockUser'
  | 'copyMessage'
  | 'deleteMessage'
  | 'deleteForMeMessage'
  | 'editMessage'
  | 'flagMessage'
  | 'markUnread'
  | 'muteUser'
  | 'pinMessage'
  | 'selectReaction'
  | 'reply'
  | 'retry'
  | 'quotedReply'
  | 'threadReply'
  | 'unpinMessage';

export type MessageActionType = {
  /**
   * Callback when user presses the action button.
   */
  action: () => void;
  /**
   * Type of the action performed.
   * Eg: 'banUser', 'blockUser', 'copyMessage', 'deleteMessage', 'editMessage', 'flagMessage', 'markUnread , 'muteUser', 'pinMessage', 'selectReaction', 'reply', 'retry', 'quotedReply', 'threadReply', 'unpinMessage'
   */
  actionType: ActionType | string;
  /**
   * Title for action button.
   */
  title: string;
  /**
   * Element to render as icon for action button.
   */
  icon?: React.ReactElement;
  /**
   * Styles for underlying Text component of action title.
   */
  titleStyle?: StyleProp<TextStyle>;

  type: 'standard' | 'destructive';
};

/**
 * MessageActionListItem - A high-level component that implements all the logic required for a `MessageAction` in a `MessageActionList`
 */
export type MessageActionListItemProps = MessageActionType;

export const MessageActionListItem = (props: MessageActionListItemProps) => {
  const { action, actionType, icon, title, titleStyle } = props;

  const {
    theme: {
      semantics,
      messageMenu: {
        actionListItem: { container, icon: iconTheme, title: titleTheme },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const onActionPress = useStableCallback(() => {
    closeOverlay();
    scheduleActionOnClose(() => action());
  });

  return (
    <Pressable
      onPress={onActionPress}
      style={({ pressed }) => [
        styles.buttonContainer,
        { backgroundColor: pressed ? semantics.backgroundUtilityPressed : 'transparent' },
      ]}
    >
      <View
        accessibilityLabel={`${actionType} action list item`}
        style={[styles.container, container]}
      >
        <View style={iconTheme}>{icon}</View>
        <Text style={[styles.titleStyle, titleStyle, titleTheme]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        buttonContainer: {
          borderRadius: primitives.radiusLg,
        },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          padding: primitives.spacingXs,
        },
        titleStyle: {
          paddingLeft: primitives.spacingXs,
          fontWeight: primitives.typographyFontWeightMedium,
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
        },
      }),
    [semantics.textPrimary],
  );
};
