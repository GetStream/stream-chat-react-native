import { useMessageContext } from '../../../contexts/messageContext/MessageContext';

export {
  type MessageActionHandlerCallbacks,
  useWithPortalKeyboardSafety,
} from './useCreateMessageActionHandlers';

/**
 * The handlers behind the message actions (copy, delete, edit, pin, mute, ...) for the message this
 * component renders. Call it inside a message, such as a custom message component or a custom
 * `MessageActionList`. Every caller shares the message's one set of handlers.
 *
 * @returns The action handlers of the message.
 */
export const useMessageActionHandlers = () => useMessageContext().messageActionHandlers;
