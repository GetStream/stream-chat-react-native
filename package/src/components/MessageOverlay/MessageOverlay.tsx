import React from 'react';
import { StyleSheet, View } from 'react-native';

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

export type MessageOverlayProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'MessageActionList'
    | 'MessageActionListItem'
    | 'OverlayReactionList'
    | 'OverlayReactions'
    | 'OverlayReactionsAvatar'
    | 'OverlayReactionsItem'
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

export const MessageOverlay = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageOverlayProps<StreamChatGenerics>,
) => {
  const {
    dismissOverlay,
    handleReaction,
    message: propMessage,
    MessageActionList: propMessageActionList,
    MessageActionListItem: propMessageActionListItem,
    messageActions,
    OverlayReactionList: propOverlayReactionList,
    OverlayReactions: propOverlayReactions,
    OverlayReactionsAvatar: propOverlayReactionsAvatar,
    OverlayReactionsItem: propOverlayReactionsItem,
    showMessageReactions,
    visible,
  } = props;
  const {
    MessageActionList: contextMessageActionList,
    MessageActionListItem: contextMessageActionListItem,
    OverlayReactionList: contextOverlayReactionList,
    OverlayReactions: contextOverlayReactions,
    OverlayReactionsAvatar: contextOverlayReactionsAvatar,
    OverlayReactionsItem: contextOverlayReactionsItem,
  } = useMessagesContext<StreamChatGenerics>();
  const { message: contextMessage } = useMessageContext<StreamChatGenerics>();
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const OverlayReactionList = propOverlayReactionList ?? contextOverlayReactionList;
  const OverlayReactions = propOverlayReactions ?? contextOverlayReactions;
  const OverlayReactionsAvatar = propOverlayReactionsAvatar ?? contextOverlayReactionsAvatar;
  const OverlayReactionsItem = propOverlayReactionsItem ?? contextOverlayReactionsItem;
  const message = propMessage ?? contextMessage;

  return (
    <BottomSheetModal onClose={dismissOverlay} visible={visible}>
      <View style={styles.contentContainer}>
        {showMessageReactions ? (
          <OverlayReactions
            message={message}
            OverlayReactionsAvatar={OverlayReactionsAvatar}
            OverlayReactionsItem={OverlayReactionsItem}
          />
        ) : (
          <>
            <OverlayReactionList
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
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
