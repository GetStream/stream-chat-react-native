import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<Attachment<At>, 'actions'> &
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'handleAction'>;

const AttachmentActionsWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: AttachmentActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { actions, handleAction } = props;

  const {
    theme: {
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
    <View style={[styles.container, container]} testID='attachment-actions'>
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

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: AttachmentActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: AttachmentActionsPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Attachment<At> &
  Partial<
    Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'handleAction'>
  >;

/**
 * AttachmentActions - The actions you can take on an attachment.
 * Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
 *
 * @example ./AttachmentActions.md
 */
export const AttachmentActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: AttachmentActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { handleAction } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();
  return <MemoizedAttachmentActions {...{ handleAction }} {...props} />;
};

AttachmentActions.displayName = 'AttachmentActions{messageSimple{actions}}';
