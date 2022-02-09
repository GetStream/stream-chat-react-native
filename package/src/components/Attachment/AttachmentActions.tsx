import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import type { Attachment } from 'stream-chat';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

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

export type AttachmentActionsPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<Attachment<StreamChatClient>, 'actions'> &
  Pick<MessageContextValue<StreamChatClient>, 'handleAction'> & {
    styles?: Partial<{
      actionButton: StyleProp<ViewStyle>;
      buttonText: StyleProp<TextStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

const AttachmentActionsWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachmentActionsPropsWithContext<StreamChatClient>,
) => {
  const { actions, handleAction, styles: stylesProp = {} } = props;

  const {
    theme: {
      colors: { accent_blue, black, border, transparent, white },
      messageSimple: {
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
    <View style={[styles.container, container, stylesProp.container]} testID='attachment-actions'>
      {actions?.map((action, index) => {
        const primary = action.style === 'primary';

        return (
          <TouchableOpacity
            key={`${index}-${action.value}`}
            onPress={() => {
              if (action.name && action.value && handleAction) {
                handleAction(action.name, action.value);
              }
            }}
            style={[
              styles.actionButton,
              {
                backgroundColor: primary
                  ? primaryBackgroundColor || accent_blue
                  : defaultBackgroundColor || white,
                borderColor: primary
                  ? primaryBorderColor || border
                  : defaultBorderColor || transparent,
              },
              buttonStyle,
              stylesProp.actionButton,
            ]}
            testID={`attachment-actions-button-${action.name}`}
          >
            <Text
              style={[
                {
                  color: primary ? primaryColor || white : defaultColor || black,
                },
                buttonTextStyle,
                stylesProp.buttonText,
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

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AttachmentActionsPropsWithContext<StreamChatClient>,
  nextProps: AttachmentActionsPropsWithContext<StreamChatClient>,
) => {
  const { actions: prevActions } = prevProps;
  const { actions: nextActions } = nextProps;

  const actionsEqual = prevActions?.length === nextActions?.length;

  return actionsEqual;
};

const MemoizedAttachmentActions = React.memo(
  AttachmentActionsWithContext,
  areEqual,
) as typeof AttachmentActionsWithContext;

export type AttachmentActionsProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Attachment<StreamChatClient> &
  Partial<Pick<MessageContextValue<StreamChatClient>, 'handleAction'>>;

/**
 * AttachmentActions - The actions you can take on an attachment.
 * Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
 */
export const AttachmentActions = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AttachmentActionsProps<StreamChatClient>,
) => {
  const { handleAction } = useMessageContext<StreamChatClient>();
  return <MemoizedAttachmentActions {...{ handleAction }} {...props} />;
};

AttachmentActions.displayName = 'AttachmentActions{messageSimple{actions}}';
