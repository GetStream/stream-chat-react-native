import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { useAccessibilityActivateAction } from '../../a11y/hooks/useAccessibilityActivateAction';
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
  /** Called when the action button is pressed. */
  action: () => void;
  /** The type of the action: an `ActionType`, or a custom string. */
  actionType: ActionType | string;
  /** Title of the action button. */
  title: string;
  /** Icon of the action button. */
  icon?: React.ReactElement;
  /** Styles for the `Text` of the action title. */
  titleStyle?: StyleProp<TextStyle>;

  type: 'standard' | 'destructive';
};

/** Props of the item that renders a `MessageActionType` in a `MessageActionList`. */
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
  const accessibilityLabel = `${actionType} action list item`;
  const accessibilityActivateActionProps = useAccessibilityActivateAction({
    onPress: onActionPress,
    shouldHandleActivate: true,
  });

  return (
    <Pressable
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='menuitem'
      {...accessibilityActivateActionProps}
      onPress={onActionPress}
      style={({ pressed }) => [
        styles.buttonContainer,
        { backgroundColor: pressed ? semantics.backgroundUtilityPressed : 'transparent' },
      ]}
    >
      <View style={[styles.container, container]}>
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
