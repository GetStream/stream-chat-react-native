import { useMessageContext } from '../../../contexts/messageContext/MessageContext';

export {
  type MessageActionHandlerCallbacks,
  useWithPortalKeyboardSafety,
} from './useCreateMessageActionHandlers';

/**
 * The handlers behind the message actions (copy, delete, edit, pin, mute, ...) for the message this
 * component renders. Call it inside a message, e.g. in a custom message component or a custom
 * `MessageActionList`. Every caller shares the message's one set of handlers.
 */
export const useMessageActionHandlers = () => useMessageContext().messageActionHandlers;
