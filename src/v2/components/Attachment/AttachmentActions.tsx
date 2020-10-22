import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Attachment } from 'stream-chat';

import type { ActionHandler } from './Attachment';

import type { DefaultAttachmentType, UnknownType } from '../../types/types';

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
});

export type AttachmentActionsProps<
  At extends UnknownType = DefaultAttachmentType
> = Attachment<At> & {
  /** The handler to execute after selecting an action */
  actionHandler?: ActionHandler;
};

/**
 * AttachmentActions - The actions you can take on an attachment.
 * Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
 *
 * @example ./AttachmentActions.md
 */
export const AttachmentActions = <
  At extends UnknownType = DefaultAttachmentType
>(
  props: AttachmentActionsProps<At>,
) => {
  const { actionHandler, actions } = props;

  const {
    theme: {
      message: {
        actions: {
          button: {
            defaultBackgroundColor,
            defaultBorderColor,
            primaryBackgroundColor,
            primaryBorderColor,
            ...buttonStyle
          },
          buttonText: { defaultColor, primaryColor, ...buttonTextStyle },
          container,
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]} testID='attachment-actions'>
      {actions?.map((action, index) => {
        const primary = action.style === 'primary';

        return (
          <TouchableOpacity
            key={`${index}-${action.value}`}
            onPress={() => {
              if (action.name && action.value && actionHandler) {
                actionHandler(action.name, action.value);
              }
            }}
            style={[
              styles.actionButton,
              {
                backgroundColor: primary
                  ? primaryBackgroundColor
                  : defaultBackgroundColor,
                borderColor: primary ? primaryBorderColor : defaultBorderColor,
              },
              buttonStyle,
            ]}
            testID={`attachment-actions-button-${action.name}`}
          >
            <Text
              style={[
                {
                  color: primary ? primaryColor : defaultColor,
                },
                buttonTextStyle,
              ]}
            >
              {action.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

AttachmentActions.displayName = 'AttachmentActions{message{actions}}';
