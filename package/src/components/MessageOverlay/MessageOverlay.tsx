import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { MessageActionType } from './MessageActionListItem';

import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
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
    closeMessageActionsBottomSheet: () => void;
    /**
     * Boolean to determine if there are message actions
     */
    isMessageActionsVisible: boolean;
    /**
     * An array of message actions to render
     */
    messageActions: MessageActionType[];
    /**
     * Reference to the bottom sheet modal
     */
    messageActionsBottomSheetRef: React.RefObject<BottomSheetModalMethods>;
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
    closeMessageActionsBottomSheet,
    handleReaction,
    isMessageActionsVisible,
    message,
    MessageActionList: propMessageActionList,
    MessageActionListItem: propMessageActionListItem,
    messageActions,
    messageActionsBottomSheetRef,
    OverlayReactionList: propOverlayReactionList,
    OverlayReactions: propOverlayReactions,
    OverlayReactionsAvatar: propOverlayReactionsAvatar,
    OverlayReactionsItem: propOverlayReactionsItem,
  } = props;
  const {
    MessageActionList: contextMessageActionList,
    MessageActionListItem: contextMessageActionListItem,
    OverlayReactionList: contextOverlayReactionList,
    OverlayReactions: contextOverlayReactions,
    OverlayReactionsAvatar: contextOverlayReactionsAvatar,
    OverlayReactionsItem: contextOverlayReactionsItem,
  } = useMessagesContext();
  const snapPoints = useMemo(() => ['50%', '50%'], []);
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const OverlayReactionList = propOverlayReactionList ?? contextOverlayReactionList;
  const OverlayReactions = propOverlayReactions ?? contextOverlayReactions;
  const OverlayReactionsAvatar = propOverlayReactionsAvatar ?? contextOverlayReactionsAvatar;
  const OverlayReactionsItem = propOverlayReactionsItem ?? contextOverlayReactionsItem;

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <BottomSheetModal
      enableDismissOnClose
      index={1}
      onChange={handleSheetChanges}
      onDismiss={closeMessageActionsBottomSheet}
      ref={messageActionsBottomSheetRef}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.contentContainer}>
        {isMessageActionsVisible ? (
          <>
            <OverlayReactionList
              dismissOverlay={closeMessageActionsBottomSheet}
              handleReaction={handleReaction}
              ownReactionTypes={message?.own_reactions?.map((reaction) => reaction.type) || []}
            />
            {messageActions?.length ? (
              <MessageActionList
                MessageActionListItem={MessageActionListItem}
                messageActions={messageActions}
              />
            ) : null}
          </>
        ) : (
          <OverlayReactions
            message={message}
            OverlayReactionsAvatar={OverlayReactionsAvatar}
            OverlayReactionsItem={OverlayReactionsItem}
          />
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
