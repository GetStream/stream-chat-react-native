import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

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
    closeMessageOverlay: () => void;
    /**
     * An array of message actions to render
     */
    messageActions: MessageActionType[];
    /**
     * Reference to the bottom sheet modal
     */
    messageActionsBottomSheetRef: React.RefObject<BottomSheetModalMethods>;
    /**
     * Boolean to determine if there are message actions
     */
    showMessageReactions: boolean;
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
    closeMessageOverlay,
    handleReaction,
    message: propMessage,
    MessageActionList: propMessageActionList,
    MessageActionListItem: propMessageActionListItem,
    messageActions,
    messageActionsBottomSheetRef,
    OverlayReactionList: propOverlayReactionList,
    OverlayReactions: propOverlayReactions,
    OverlayReactionsAvatar: propOverlayReactionsAvatar,
    OverlayReactionsItem: propOverlayReactionsItem,
    showMessageReactions,
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
  const snapPoints = useMemo(() => ['50%', '50%'], []);
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const OverlayReactionList = propOverlayReactionList ?? contextOverlayReactionList;
  const OverlayReactions = propOverlayReactions ?? contextOverlayReactions;
  const OverlayReactionsAvatar = propOverlayReactionsAvatar ?? contextOverlayReactionsAvatar;
  const OverlayReactionsItem = propOverlayReactionsItem ?? contextOverlayReactionsItem;
  const message = propMessage ?? contextMessage;

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <BottomSheetModal
      backdropComponent={BottomSheetBackdrop}
      enablePanDownToClose
      index={0}
      onChange={handleSheetChanges}
      onDismiss={closeMessageOverlay}
      ref={messageActionsBottomSheetRef}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.contentContainer}>
        {showMessageReactions ? (
          <OverlayReactions
            message={message}
            OverlayReactionsAvatar={OverlayReactionsAvatar}
            OverlayReactionsItem={OverlayReactionsItem}
          />
        ) : (
          <>
            <OverlayReactionList
              dismissOverlay={closeMessageOverlay}
              handleReaction={handleReaction}
              ownReactionTypes={message?.own_reactions?.map((reaction) => reaction.type) || []}
            />
            <MessageActionList
              MessageActionListItem={MessageActionListItem}
              messageActions={messageActions}
            />
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
