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
import { DefaultStreamChatGenerics } from '../../types/types';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';

export type MessageMenuProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'MessageActionList'
    | 'MessageActionListItem'
    | 'MessageReactionPicker'
    | 'MessageUserReactions'
    | 'MessageUserReactionsAvatar'
    | 'MessageUserReactionsItem'
  >
> &
  Partial<Pick<MessageContextValue<StreamChatGenerics>, 'message'>> & {
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
  };

export const MessageMenu = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageMenuProps<StreamChatGenerics>,
) => {
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
  } = useMessagesContext<StreamChatGenerics>();
  const { message: contextMessage } = useMessageContext<StreamChatGenerics>();
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const MessageReactionPicker = propMessageReactionPicker ?? contextMessageReactionPicker;
  const MessageUserReactions = propMessageUserReactions ?? contextMessageUserReactions;
  const MessageUserReactionsAvatar =
    propMessageUserReactionsAvatar ?? contextMessageUserReactionsAvatar;
  const MessageUserReactionsItem = propMessageUserReactionsItem ?? contextMessageUserReactionsItem;
  const message = propMessage ?? contextMessage;

  return (
    <BottomSheetModal
      height={messageActions.length === 0 && !showMessageReactions ? height / 5 : height / 2}
      onClose={dismissOverlay}
      visible={visible}
    >
      {showMessageReactions ? (
        <MessageUserReactions
          message={message}
          MessageUserReactionsAvatar={MessageUserReactionsAvatar}
          MessageUserReactionsItem={MessageUserReactionsItem}
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
