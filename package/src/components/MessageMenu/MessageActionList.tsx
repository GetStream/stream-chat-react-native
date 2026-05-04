import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { MessageActionType } from './MessageActionListItem';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type MessageActionListProps = {
  /**
   * Function to close the message actions bottom sheet
   * @returns void
   */
  dismissOverlay?: () => void;
  /**
   * An array of message actions to render
   */
  messageActions?: MessageActionType[];
};

export const MessageActionList = (props: MessageActionListProps) => {
  const { messageActions } = props;
  const { MessageActionListItem } = useComponentsContext();
  const a11yLabel = useA11yLabel('a11y/Message actions');
  const {
    theme: {
      messageMenu: {
        actionList: { container, contentContainer },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const standardActions = messageActions?.filter((action) => action.type === 'standard') ?? [];
  const destructiveActions =
    messageActions?.filter((action) => action.type === 'destructive') ?? [];

  if (messageActions?.length === 0) {
    return null;
  }

  return (
    <ScrollView
      accessibilityLabel={a11yLabel ?? 'Message action list'}
      accessibilityRole='menu'
      contentContainerStyle={[styles.contentContainer, contentContainer]}
      style={[styles.container, container]}
    >
      {standardActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: standardActions.length }}
        />
      ))}
      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
      </View>
      {destructiveActions?.map((messageAction, index) => (
        <MessageActionListItem
          key={messageAction.title}
          {...{ ...messageAction, index, length: standardActions.length }}
        />
      ))}
    </ScrollView>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: primitives.radiusLg,
          marginTop: 6,
          backgroundColor: semantics.backgroundCoreElevation2,
          borderWidth: 1,
          borderColor: semantics.borderCoreDefault,
        },
        contentContainer: {
          borderRadius: 16,
          flexGrow: 1,
          minWidth: 250,
          padding: primitives.spacingXxs,
          backgroundColor: semantics.backgroundCoreElevation2,
        },
        separatorContainer: {
          paddingVertical: primitives.spacingXxs,
        },
        separator: {
          height: 1,
          width: '100%',
          backgroundColor: semantics.borderCoreDefault,
        },
      }),
    [semantics],
  );
};
