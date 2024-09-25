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
    closeMessageActionsBottomSheet: () => void;
    isMessageActionsVisible: boolean;
    messageActions: MessageActionType[];
    messageActionsBottomSheetRef: React.RefObject<BottomSheetModalMethods>;
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
