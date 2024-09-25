import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { MessageActionType } from './MessageActionListItem';

import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { OverlayProviderProps } from '../../contexts/overlayContext/OverlayContext';
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
  Partial<
    Pick<OverlayProviderProps<StreamChatGenerics>, 'isMyMessage' | 'isThreadMessage' | 'message'>
  > & {
    closeMessageActionsBottomSheet: () => void;
    isErrorInMessage: boolean;
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
    isErrorInMessage,
    isMessageActionsVisible,
    isMyMessage: propIsMyMessage,
    isThreadMessage,
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
  const { isMyMessage: contextIsMyMessage } = useMessageContext();
  const snapPoints = useMemo(() => ['50%', '50%'], []);
  const isMyMessage = propIsMyMessage ?? contextIsMyMessage;
  const MessageActionList = propMessageActionList ?? contextMessageActionList;
  const MessageActionListItem = propMessageActionListItem ?? contextMessageActionListItem;
  const OverlayReactionList = propOverlayReactionList ?? contextOverlayReactionList;
  const OverlayReactions = propOverlayReactions ?? contextOverlayReactions;
  const OverlayReactionsAvatar = propOverlayReactionsAvatar ?? contextOverlayReactionsAvatar;
  const OverlayReactionsItem = propOverlayReactionsItem ?? contextOverlayReactionsItem;

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const messageActionProps = {
    error: isErrorInMessage,
    isMyMessage,
    isThreadMessage,
    message,
    messageActions,
  };

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
                {...messageActionProps}
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
