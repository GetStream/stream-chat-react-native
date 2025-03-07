import React from 'react';

import { useWindowDimensions } from 'react-native';

import { MessageActionType } from './MessageActionListItem';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';

export type MessageMenuProps = Partial<
  Pick<
    MessagesContextValue,
    | 'MessageActionList'
    | 'MessageActionListItem'
    | 'MessageReactionPicker'
    | 'MessageUserReactions'
    | 'MessageUserReactionsAvatar'
    | 'MessageUserReactionsItem'
  >
> &
  Partial<Pick<MessageContextValue, 'message'>> & {
    /**
     * Function to close the message actions bottom sheet
     * @returns void
     */
    dismissOverlay: () => void;
    /**
     * An array of message actions to render
     */
    messageActions: MessageActionType[];
    /**
     * Boolean to determine if there are message actions
     */
    showMessageReactions: boolean;
    /**
     * Boolean to determine if the overlay is visible.
     */
    visible: boolean;
    /**
     * Function to handle reaction on press
     * @param reactionType
     * @returns
     */
    handleReaction?: (reactionType: string) => Promise<void>;
    /**
     * The selected reaction
     */
    selectedReaction?: string;
  };

export const MessageMenu = (props: MessageMenuProps) => {
  const {
    dismissOverlay,
    handleReaction,
    message: propMessage,
    MessageActionList: propMessageActionList,
    MessageActionListItem: propMessageActionListItem,
    messageActions,
    MessageReactionPicker: propMessageReactionPicker,
    MessageUserReactions: propMessageUserReactions,
    MessageUserReactionsAvatar: propMessageUserReactionsAvatar,
    MessageUserReactionsItem: propMessageUserReactionsItem,
    selectedReaction,
    showMessageReactions,
    visible,
  } = props;
  const { height } = useWindowDimensions();
  const {
    MessageActionList: contextMessageActionList,
    MessageActionListItem: contextMessageActionListItem,
    MessageReactionPicker: contextMessageReactionPicker,
    MessageUserReactions: contextMessageUserReactions,
    MessageUserReactionsAvatar: contextMessageUserReactionsAvatar,
    MessageUserReactionsItem: contextMessageUserReactionsItem,
  } = useMessagesContext();
  const { message: contextMessage } = useMessageContext();
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const MessageReactionPicker = propMessageReactionPicker ?? contextMessageReactionPicker;
  const MessageUserReactions = propMessageUserReactions ?? contextMessageUserReactions;
  const MessageUserReactionsAvatar =
    propMessageUserReactionsAvatar ?? contextMessageUserReactionsAvatar;
  const MessageUserReactionsItem = propMessageUserReactionsItem ?? contextMessageUserReactionsItem;
  const message = propMessage ?? contextMessage;
  const {
    theme: {
      messageMenu: {
        bottomSheet: { height: bottomSheetHeight },
      },
    },
  } = useTheme();

  return (
    <BottomSheetModal
      height={
        bottomSheetHeight
          ? bottomSheetHeight
          : messageActions.length === 0 && !showMessageReactions
            ? height / 5
            : height / 2
      }
      onClose={dismissOverlay}
      visible={visible}
    >
      {showMessageReactions ? (
        <MessageUserReactions
          message={message}
          MessageUserReactionsAvatar={MessageUserReactionsAvatar}
          MessageUserReactionsItem={MessageUserReactionsItem}
          selectedReaction={selectedReaction}
        />
      ) : (
        <>
          <MessageReactionPicker
            dismissOverlay={dismissOverlay}
            handleReaction={handleReaction}
            ownReactionTypes={message?.own_reactions?.map((reaction) => reaction.type) || []}
          />
          <MessageActionList
            dismissOverlay={dismissOverlay}
            MessageActionListItem={MessageActionListItem}
            messageActions={messageActions}
          />
        </>
      )}
    </BottomSheetModal>
  );
};
