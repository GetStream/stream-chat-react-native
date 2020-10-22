import React, { useEffect, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { MESSAGE_ACTIONS } from '../../../utils/utils';

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 50,
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#388CEA',
    fontSize: 18,
  },
  cancelButtonContainer: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#FF0000',
    fontSize: 18,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#757575',
    fontSize: 14,
  },
});

export type ActionSheetStyles = {
  body?: StyleProp<ViewStyle>;
  buttonBox?: StyleProp<ViewStyle>;
  buttonText?: StyleProp<TextStyle>;
  cancelButtonBox?: StyleProp<ViewStyle>;
  messageBox?: StyleProp<ViewStyle>;
  messageText?: StyleProp<TextStyle>;
  overlay?: StyleProp<TextStyle>;
  titleBox?: StyleProp<ViewStyle>;
  titleText?: StyleProp<TextStyle>;
  wrapper?: StyleProp<ViewStyle>;
};

export type MessageActionSheetProps = {
  /**
   * Handler to delete a current message
   */
  handleDelete: () => Promise<void>;
  /**
   * Handler to edit a current message. This function sets the current message as the `editing` property of channel context.
   * The `editing` prop is used by the MessageInput component to switch to edit mode.
   */
  handleEdit: () => void;
  /**
   * Function that opens the reaction picker
   */
  openReactionPicker: () => Promise<void>;
  /**
   * Function that opens a thread and gives the option to add a reply on a message
   */
  openThread: () => void;
  /**
   * Whether or not message reactions are enabled
   */
  reactionsEnabled: boolean;
  /**
   * The action sheet ref declared in MessageContent. To access the ref, ensure the ActionSheet custom
   * component is wrapped in `React.forwardRef`.
   */
  ref: React.MutableRefObject<ActionSheet | undefined>;
  /**
   * Whether or not message replies are enabled
   */
  repliesEnabled: boolean;
  /**
   * React useState hook setter function that toggles action sheet visibility
   */
  setActionSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Style object for action sheet (used to style message actions)
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/../styles.js
   */
  actionSheetStyles?: ActionSheetStyles;
  /**
   * Function that returns a boolean indicating whether or not the user can delete the message.
   */
  canDeleteMessage?: () => boolean | undefined;
  /**
   * Function that returns a boolean indicating whether or not the user can edit the message.
   */
  canEditMessage?: () => boolean | undefined;
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   */
  messageActions?: boolean | string[];
  /**
   * Whether or not the MessageList is part of a Thread
   */
  threadList?: boolean;
};

export const MessageActionSheet = React.forwardRef(
  (props: MessageActionSheetProps, actionSheetRef) => {
    const {
      actionSheetStyles,
      canDeleteMessage,
      canEditMessage,
      handleDelete,
      handleEdit,
      messageActions = Object.keys(MESSAGE_ACTIONS),
      openReactionPicker,
      openThread,
      reactionsEnabled,
      repliesEnabled,
      setActionSheetVisible,
      threadList,
    } = props;

    const {
      theme: {
        message: {
          actionSheet: {
            buttonContainer,
            buttonText,
            cancelButtonContainer,
            cancelButtonText,
            titleContainer,
            titleText,
          },
        },
      },
    } = useTheme();
    const { t } = useTranslationContext();
    const [options, setOptions] = useState([{ id: 'cancel', title: 'Cancel' }]);

    useEffect(() => {
      const newOptions: {
        id: string;
        title: string;
      }[] = [];

      if (Array.isArray(messageActions)) {
        if (
          reactionsEnabled &&
          messageActions.indexOf(MESSAGE_ACTIONS.reactions) > -1
        ) {
          newOptions.splice(1, 0, {
            id: MESSAGE_ACTIONS.reactions,
            title: t('Add Reaction'),
          });
        }

        if (
          repliesEnabled &&
          messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 &&
          !threadList
        ) {
          newOptions.splice(1, 0, {
            id: MESSAGE_ACTIONS.reply,
            title: t('Reply'),
          });
        }

        if (
          messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 &&
          canEditMessage?.()
        ) {
          newOptions.splice(1, 0, {
            id: MESSAGE_ACTIONS.edit,
            title: t('Edit Message'),
          });
        }

        if (
          messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 &&
          canDeleteMessage?.()
        ) {
          newOptions.splice(1, 0, {
            id: MESSAGE_ACTIONS.delete,
            title: t('Delete Message'),
          });
        }
      }

      setOptions((prevOptions) => [...prevOptions, ...newOptions]);
    }, []);

    const onActionPress = async (action: string) => {
      switch (action) {
        case MESSAGE_ACTIONS.edit:
          handleEdit();
          break;
        case MESSAGE_ACTIONS.delete:
          await handleDelete();
          break;
        case MESSAGE_ACTIONS.reply:
          openThread();
          break;
        case MESSAGE_ACTIONS.reactions:
          openReactionPicker();
          break;
        default:
          break;
      }
      setActionSheetVisible(false);
    };

    return (
      <ActionSheet
        cancelButtonIndex={0}
        destructiveButtonIndex={0}
        onPress={(index) => onActionPress(options[index].id)}
        options={options.map((option, i) => {
          if (i === 0) {
            return (
              <View
                style={[styles.cancelButtonContainer, cancelButtonContainer]}
                testID='cancel-button'
              >
                <Text style={[styles.cancelButtonText, cancelButtonText]}>
                  {t('Cancel')}
                </Text>
              </View>
            );
          }
          return (
            <View
              key={option.title}
              style={[styles.buttonContainer, buttonContainer]}
              testID={`action-sheet-item-${option.title}`}
            >
              <Text style={[styles.buttonText, buttonText]}>
                {option.title}
              </Text>
            </View>
          );
        })}
        ref={actionSheetRef as React.MutableRefObject<ActionSheet>}
        styles={actionSheetStyles}
        title={
          <View
            style={[styles.titleContainer, titleContainer]}
            testID='action-sheet-container'
          >
            <Text style={[styles.titleText, titleText]}>
              {t('Choose an action')}
            </Text>
          </View>
        }
      />
    );
  },
);

MessageActionSheet.displayName = 'MessageActionSheet{message{actionSheet}}';
