import {
  type AIConversationStatus,
  type AIUserMessageActions,
  isAIConversationAnswering,
} from './types';

import type { AIBranchSwitch } from '../../message/AIBranchSwitcher';
import type { AIMessageRating, AIReplyActionsProps } from '../../message/AIReplyActions';
import type { AIMessage, AIMessageBranch } from '../types';

type Offerer<Message extends AIMessage> = {
  actions: { edit: boolean; rate: boolean; regenerate: boolean };
  canSwitchBranch: boolean;
  // The message whose version a switch on its way changes, if any.
  switchingMessageId: string | undefined;
  edit: (message: Message) => void;
  editInPlace: (message: Message, text: string) => void;
  rate: (reply: Message, rating: AIMessageRating | null) => void;
  regenerate: (reply: Message) => void;
  switchBranch: (message: Message, to: 'previous' | 'next') => void;
};

// Whether a message other than the latest can be answered again: while the transport switches
// versions, and the message has a version mark (`responseId`), without which the transport has
// nothing to branch from.
const isBranchable = <Message extends AIMessage>(offerer: Offerer<Message>, message: Message) =>
  offerer.canSwitchBranch && !!message.responseId;

// What the offers depend on besides the message: whether the agent is answering, which leaves
// out everything that would start a request, and whether a switch to another version is on its
// way, which leaves out the arrows, and regenerating and editing the message it switches. Any
// other request gives up on the switch.
type Busy = { isSwitchingBranch?: boolean; status: AIConversationStatus };

const isBusy = ({ isSwitchingBranch, status }: Busy) =>
  !!isSwitchingBranch || isAIConversationAnswering(status);

// Whether a request about `message` can start: the agent isn't answering, and no switch on its
// way changes it.
const canAnswerAgain = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  { isSwitchingBranch, status }: Busy,
  message: Message,
) =>
  !isAIConversationAnswering(status) &&
  !(isSwitchingBranch && offerer.switchingMessageId === message.id);

// The ‹ i/n › switcher of a message with several versions of the kind `of`, while the transport
// can switch them. Its arrows are left out at their ends, while the agent is answering and while
// another switch is on its way.
const branchSwitchOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  busy: Busy,
  message: Message,
  of: AIMessageBranch['of'],
): AIBranchSwitch | undefined => {
  const { branch } = message;
  if (!offerer.canSwitchBranch || branch?.of !== of || !(branch.count > 1)) return undefined;
  const { count, index } = branch;
  const isAnswering = isBusy(busy);
  // The mark's ends, which the controller leaves the transport to judge past the last: a version
  // may have been added since the mark was written.
  return {
    count,
    index,
    onNext: !isAnswering && index < count ? () => offerer.switchBranch(message, 'next') : undefined,
    onPrevious:
      !isAnswering && index > 1 ? () => offerer.switchBranch(message, 'previous') : undefined,
  };
};

// What the person can do with a finished reply: rate it, write it again while the agent isn't
// answering (the latest, or any with a version mark while the transport can switch versions),
// and switch between its versions.
export const replyActionsOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  {
    isSwitchingBranch,
    ratings,
    status,
  }: Busy & { ratings: Readonly<Record<string, AIMessageRating>> },
  reply: Message,
  isLatestReply: boolean,
): Omit<AIReplyActionsProps, 'text'> => {
  const actions: Omit<AIReplyActionsProps, 'text'> = {
    onRate: offerer.actions.rate ? (rating) => offerer.rate(reply, rating) : undefined,
    onRegenerate:
      offerer.actions.regenerate &&
      (isLatestReply || isBranchable(offerer, reply)) &&
      canAnswerAgain(offerer, { isSwitchingBranch, status }, reply)
        ? () => offerer.regenerate(reply)
        : undefined,
    rating: ratings[reply.id] ?? null,
  };
  const branch = branchSwitchOf(offerer, { isSwitchingBranch, status }, reply, 'reply');
  if (branch) actions.branch = branch;
  return actions;
};

/** The id of the person's latest message, the one they can edit. */
export const latestUserMessageIdOf = (messages: readonly AIMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return messages[index].id;
  }
  return undefined;
};

type EditState = Busy & { latestUserMessageId: string | undefined };

// Whether a message of the person's can be edited while the agent isn't answering: their
// latest, or any with a version mark while the transport can switch versions.
const isEditable = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  { isSwitchingBranch, latestUserMessageId, status }: EditState,
  message: Message,
) =>
  offerer.actions.edit &&
  message.role === 'user' &&
  canAnswerAgain(offerer, { isSwitchingBranch, status }, message) &&
  (latestUserMessageId === message.id || isBranchable(offerer, message));

// Edits a message of the person's in the composer, when it can be edited.
export const editActionOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  state: EditState,
  message: Message,
): (() => void) | undefined =>
  isEditable(offerer, state, message) ? () => offerer.edit(message) : undefined;

// What a message of the person's offers while the transport can switch versions: the switcher
// between the versions of a question they edited, and editing it in place when it can be edited.
export const userMessageActionsOf = <Message extends AIMessage>(
  offerer: Offerer<Message>,
  state: EditState,
  message: Message,
): AIUserMessageActions | undefined => {
  if (message.role !== 'user' || !offerer.canSwitchBranch) return undefined;
  const actions: AIUserMessageActions = {};
  const branch = branchSwitchOf(offerer, state, message, 'question');
  if (branch) actions.branch = branch;
  if (isEditable(offerer, state, message)) {
    actions.onSaveEdit = (text) => offerer.editInPlace(message, text);
  }
  return actions.branch || actions.onSaveEdit ? actions : undefined;
};
