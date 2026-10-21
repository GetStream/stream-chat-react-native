import React from 'react';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { MessageStatusTypes } from '../../utils/utils';
import { useMessageActions } from '../Message/hooks/useMessageActions';
import { useMessageOperations } from '../Message/hooks/useMessageOperations';
import { messageActions as defaultMessageActions } from '../Message/utils/messageActions';

/**
 * Renders the action list of the open message menu. The actions are built only while a menu is
 * open, not on every message render.
 */
export const MessageActionListWithActions = () => {
  const { MessageActionList } = useComponentsContext();
  const { dismissOverlay, isMyMessage, message } = useMessageContext();
  const { thread } = useThreadContext();
  const { messageActions: messageActionsProp = defaultMessageActions } = useMessagesContext();
  const { updateMessage } = useMessageOperations();
  const ownCapabilities = useOwnCapabilitiesContext();
  const {
    banUser,
    blockUser,
    copyMessage,
    deleteForMeMessage,
    deleteMessage,
    editMessage,
    flagMessage,
    markUnread,
    muteUser,
    pinMessage,
    quotedReply,
    retry,
    threadReply,
    unpinMessage,
  } = useMessageActions();

  const messageActions =
    typeof messageActionsProp !== 'function'
      ? messageActionsProp
      : messageActionsProp({
          banUser,
          blockUser,
          copyMessage,
          deleteForMeMessage,
          deleteMessage,
          dismissOverlay,
          editMessage,
          error: message.type === 'error' || message.status === MessageStatusTypes.FAILED,
          flagMessage,
          isMyMessage,
          isThreadMessage: !!thread || !!message.parent_id,
          markUnread,
          message,
          muteUser,
          ownCapabilities,
          pinMessage,
          quotedReply,
          retry,
          threadReply,
          unpinMessage,
          updateMessage,
        });

  return <MessageActionList dismissOverlay={dismissOverlay} messageActions={messageActions} />;
};
