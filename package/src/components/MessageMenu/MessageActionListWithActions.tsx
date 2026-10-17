import React from 'react';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { MessageStatusTypes } from '../../utils/utils';
import { useMessageActions } from '../Message/hooks/useMessageActions';
import { useMessageOperations } from '../Message/hooks/useMessageOperations';
import { messageActions as defaultMessageActions } from '../Message/utils/messageActions';

/**
 * The action menu's list. Lives inside the open overlay, so the actions are only built while a
 * menu is open rather than on every render of every message.
 */
export const MessageActionListWithActions = () => {
  const { MessageActionList } = useComponentsContext();
  const { dismissOverlay, isMyMessage, message, threadList } = useMessageContext();
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
          isThreadMessage: threadList || !!message.parent_id,
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
