import type { OwnCapabilitiesContextValue } from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import type { MessageActionType } from '../../../MessageMenu/MessageActionListItem';
import { messageActions, MessageActionsParams } from '../messageActions';

const action = (actionType: string) => ({ actionType }) as unknown as MessageActionType;

const getActionTypes = (overrides: Partial<MessageActionsParams>) =>
  messageActions({
    banUser: action('banUser'),
    blockUser: action('blockUser'),
    copyMessage: action('copyMessage'),
    deleteMessage: action('deleteMessage'),
    dismissOverlay: jest.fn(),
    editMessage: action('editMessage'),
    error: false,
    flagMessage: action('flagMessage'),
    isMyMessage: false,
    isThreadMessage: false,
    markUnread: action('markUnread'),
    message: generateMessage(),
    muteUser: action('muteUser'),
    ownCapabilities: {
      quoteMessage: true,
      readEvents: true,
      sendReply: true,
    } as OwnCapabilitiesContextValue,
    pinMessage: action('pinMessage'),
    quotedReply: action('quotedReply'),
    retry: action('retry'),
    threadReply: action('threadReply'),
    unpinMessage: action('unpinMessage'),
    updateMessage: jest.fn(),
    ...overrides,
  })?.map((item) => item.actionType);

describe('messageActions', () => {
  it('offers quoting a thread message, but not replying in a thread or marking it unread', () => {
    const actionTypes = getActionTypes({ isThreadMessage: true });

    expect(actionTypes).toContain('quotedReply');
    expect(actionTypes).not.toContain('threadReply');
    expect(actionTypes).not.toContain('markUnread');
  });

  it('does not offer quoting a message that failed or is an error', () => {
    expect(getActionTypes({ error: true })).not.toContain('quotedReply');
  });

  it('does not offer quoting without the quote-message capability', () => {
    expect(
      getActionTypes({
        ownCapabilities: { quoteMessage: false } as OwnCapabilitiesContextValue,
      }),
    ).not.toContain('quotedReply');
  });
});
