import { describe, it } from '@jest/globals';

import { forbiddenWord, MessageDeliveryStatus } from '../mock-server/DataTypes';
import {
  disableInternetConnection,
  enableInternetConnection,
  goToBackground,
  goToForeground,
} from '../support/Device';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

describe('MessageListTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  // MARK: Message sending

  it('test_messageListUpdates_whenParticipantSendsMessage', async () => {
    allureId(13141);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('THEN user receives a message', () =>
      userRobot.assertMessage(sampleText).assertMessageAuthor(false),
    );
  });

  it('test_messageListUpdates_whenUserSendsMessage', async () => {
    allureId(13142);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a message', () => userRobot.sendMessage(sampleText));
    await step('THEN message list updates', () =>
      userRobot
        .assertMessage(sampleText)
        .assertMessageAuthor(true)
        .assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  });

  it('test_userSendsMessageWithOneEmoji', async () => {
    allureId(13143);
    const message = '🤖';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`WHEN user sends the emoji: ${message}`, () => userRobot.sendMessage(message));
    await step('THEN the message is delivered', () =>
      userRobot.assertMessage(message).assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  });

  it('test_userSendsMessageWithMultipleEmojis', async () => {
    allureId(13144);
    const message = '🤖🔥✅';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`WHEN user sends a message with multiple emojis: ${message}`, () =>
      userRobot.sendMessage(message),
    );
    await step('THEN the message is delivered', () =>
      userRobot.assertMessage(message).assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  });

  // MARK: Message editing

  it('test_userEditsMessage', async () => {
    allureId(13145);
    const editedMessage = 'hello';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user edits the message', () => userRobot.editMessage(editedMessage));
    await step('THEN the message is edited', () =>
      userRobot
        .assertEditedMessage(editedMessage)
        .assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  });

  it('test_participantEditsMessage', async () => {
    allureId(13146);
    const editedMessage = 'hello';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND participant edits the message', () =>
      participantRobot.editMessage(editedMessage),
    );
    await step('THEN the message is edited', () => userRobot.assertEditedMessage(editedMessage));
  });

  it('test_userEditsThreadReply', async () => {
    allureId(13147);
    const message = 'message';
    const threadReply = 'thread reply';
    const editedThreadReply = 'edited thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(message);
      await userRobot.assertMessage(message);
    });
    await step('AND user replies to the message in thread', () =>
      userRobot.openThread().sendMessageInThread(threadReply).assertMessage(threadReply),
    );
    await step('WHEN user edits the thread reply', () => userRobot.editMessage(editedThreadReply));
    await step('THEN the thread reply is edited and marked as edited', () =>
      userRobot.assertThreadIsOpen().assertEditedMessage(editedThreadReply),
    );
  });

  it('test_participantEditsThreadReply', async () => {
    allureId(13148);
    const message = 'message';
    const threadReply = 'thread reply';
    const editedThreadReply = 'edited thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step('AND participant replies to the message in thread', () =>
      participantRobot.sendMessageInThread(threadReply),
    );
    await step('AND user opens the thread', () =>
      userRobot.openThread(0, false).assertThreadMessage(threadReply),
    );
    await step('WHEN participant edits the thread reply', () =>
      participantRobot.editMessageInThread(editedThreadReply),
    );
    await step('THEN the thread reply is edited and marked as edited', () =>
      userRobot.assertEditedMessage(editedThreadReply),
    );
  });

  it('test_threadReplyIsEditedEverywhere_whenParticipantEditsThreadReplySentAlsoToChannel', async () => {
    allureId(13149);
    const message = 'message';
    const threadReply = 'thread reply';
    const editedThreadReply = 'edited thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step(
      'AND participant replies to the message in thread and also sends it to the channel',
      async () => {
        await participantRobot.sendMessageInThread(threadReply, true);
        await userRobot.assertMessage(threadReply);
      },
    );
    await step('WHEN participant edits the thread reply', () =>
      participantRobot.editMessageInThread(editedThreadReply, true),
    );
    await step('THEN the thread reply is edited in the channel', () =>
      userRobot.assertEditedMessage(editedThreadReply),
    );
    await step('AND the thread reply is edited in the thread', () =>
      userRobot
        .openThread(1, false)
        .assertThreadMessage(editedThreadReply)
        .assertEditedMessage(editedThreadReply),
    );
  });

  // MARK: Message size

  it('test_messageIncreases_whenUserEditsMessageWithOneLineText', async () => {
    allureId(13150);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`AND user sends a one line message: ${sampleText}`, () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('THEN user verifies that message cell increases after editing', () =>
      userRobot.assertMessageSizeChangesAfterEditing(true),
    );
  });

  it('test_messageDecreases_whenUserEditsMessage', async () => {
    allureId(13151);
    const message = 'test\nmessage';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`AND user sends a two line message: ${message}`, () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step('THEN user verifies that message cell decreases after editing', () =>
      userRobot.assertMessageSizeChangesAfterEditing(false),
    );
  });

  // MARK: Composer

  it('test_composerSizeChange', async () => {
    allureId(13152);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('THEN user verifies that composer size changes', () =>
      userRobot.assertComposerSize(true),
    );
  });

  it('test_composerSizeDoesNotChange', async () => {
    allureId(13153);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('THEN user verifies that composer does not grow more than 5 lines', () =>
      userRobot.assertComposerSize(false),
    );
  });

  it('test_addingCommandHidesAttachmentsButton', async () => {
    allureId(13154);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user observes the attachments button', () =>
      userRobot.assertComposerAttachmentsButton(true),
    );
    await step('WHEN user selects the giphy command from the suggestions', () =>
      userRobot
        .openComposerCommands()
        .assertComposerCommandsMenu(true)
        .tapOnGiphyCommandSuggestion(),
    );
    await step('THEN the attachments button disappears', () =>
      userRobot.assertComposerAttachmentsButton(false),
    );
  });

  // https://linear.app/stream/issue/RN-497
  it.skip('test_addingCommandHidesLeftButtons', async () => {
    allureId(13319);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step("WHEN user types '/'", () => userRobot.openComposerCommands());
    await step('THEN composer left buttons disappear', () =>
      userRobot.assertComposerAttachmentsButton(false),
    );
    await step("WHEN user removes '/'", () => userRobot.clearComposer());
    await step('THEN composer left buttons appear', () =>
      userRobot.assertComposerAttachmentsButton(true),
    );
  });

  // https://linear.app/stream/issue/RN-497
  it.skip('test_commandsPopupDisappear_whenUserTapsOnMessageList', async () => {
    allureId(13155);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('AND user opens command suggestions', () =>
      userRobot.openComposerCommands().assertComposerCommandsMenu(true),
    );
    await step('WHEN user taps on message list', () => userRobot.tapOnMessageList());
    await step('THEN command suggestions disappear', () =>
      userRobot.assertComposerCommandsMenu(false),
    );
  });

  // MARK: Typing indicator

  it('test_typingIndicator', async () => {
    allureId(13156);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant starts typing', () => participantRobot.startTyping());
    await step('THEN user observes typing indicator is shown', () =>
      userRobot.assertTypingIndicator(true),
    );
    await step('WHEN participant stops typing', () => participantRobot.stopTyping());
    await step('THEN user observes typing indicator has disappeared', () =>
      userRobot.assertTypingIndicator(false),
    );
  });

  it('test_threadTypingIndicatorHidden_whenParticipantStopsTyping', async () => {
    allureId(13157);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user opens the thread', () => userRobot.openThread());
    await step('WHEN participant starts typing in thread', () =>
      participantRobot.startTypingInThread(),
    );
    await step('THEN user observes typing indicator is shown', () =>
      userRobot.assertTypingIndicator(true),
    );
    await step('WHEN participant stops typing in thread', () =>
      participantRobot.stopTypingInThread(),
    );
    await step('THEN user observes typing indicator has disappeared', () =>
      userRobot.assertTypingIndicator(false),
    );
  });

  // MARK: Offline mode

  itOnAndroid('test_offlineMessageInTheMessageList', async () => {
    allureId(13158);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user goes to background', () => goToBackground());
    await step("AND user's WebSocket connection is closed", () =>
      backendRobot.waitForWebSocketDisconnection(),
    );
    await step('WHEN participant sends a new message', () =>
      participantRobot.sendMessage(sampleText),
    );
    await step('AND user becomes offline', () => disableInternetConnection());
    await step('AND user comes back to foreground', () => goToForeground());
    await step('THEN user does not observe a new message from participant', () =>
      userRobot.assertMessage(sampleText, false),
    );
    await step('AND user becomes online', () => enableInternetConnection());
    await step('THEN user observes a new message from participant', () =>
      userRobot.assertMessage(sampleText),
    );
  });

  // https://linear.app/stream/issue/RN-500
  it.skip('test_userAddsMessageWhileOffline', async () => {
    allureId(13159);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user becomes offline', () => disableInternetConnection());
    await step('WHEN user sends a new message', () => userRobot.sendMessage(sampleText));
    await step('THEN pending indicator is shown for the message', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.PENDING, 1),
    );
    await step('WHEN user becomes online', () => enableInternetConnection());
    await step('THEN new message is delivered', () =>
      userRobot
        .assertMessageDeliveryStatus(MessageDeliveryStatus.SENT, 1)
        .assertMessageFailedIcon(false),
    );
  });

  it('test_offlineRecoveryWithinSession', async () => {
    allureId(13160);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user goes to the background', () => goToBackground());
    await step("AND user's WebSocket connection is closed", () =>
      backendRobot.waitForWebSocketDisconnection(),
    );
    await step('WHEN participant sends a new message', () =>
      participantRobot.sendMessage(sampleText),
    );
    await step('AND user comes back to the foreground', () => goToForeground());
    await step('THEN new message is delivered', () =>
      userRobot.assertMessage(sampleText).assertMessageAuthor(false),
    );
  });

  // MARK: Scrolling

  it('test_messageListScrollsDown_whenMessageListIsScrolledUp_andUserSendsNewMessage', async () => {
    allureId(13161);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user scrolls up', () => userRobot.scrollMessageListUp());
    await step('AND user sends a new message', () => userRobot.sendMessage(sampleText));
    await step('THEN message list is scrolled down', () =>
      userRobot.assertScrollToBottomButton(false).assertMessage(sampleText),
    );
  });

  it('test_messageListScrollsDown_whenMessageListIsScrolledDown_andUserReceivesNewMessage', async () => {
    allureId(13162);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('THEN message list is scrolled down', () =>
      userRobot.assertScrollToBottomButton(false).assertMessage(sampleText),
    );
  });

  it('test_messageListDoesNotScrollDown_whenMessageListIsScrolledUp_andUserReceivesNewMessage', async () => {
    allureId(13163);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user scrolls up', () => userRobot.scrollMessageListUp());
    await step('AND participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('THEN message list is not scrolled down', () =>
      userRobot.assertMessage(sampleText, false).assertScrollToBottomButton(true),
    );
    await step('WHEN user taps on scroll to bottom button', () =>
      userRobot.tapOnScrollToBottomButton(),
    );
    await step('THEN message list is scrolled down', () =>
      userRobot.assertMessage(sampleText).assertScrollToBottomButton(false),
    );
  });

  it('test_messageListScrollsDown_whenUserTapsOnScrollToBottomButton', async () => {
    allureId(13164);
    const newMessage = 'New message';
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(newMessage).assertMessage(newMessage),
    );
    await step('WHEN user scrolls up', () => userRobot.scrollMessageListUp());
    await step('AND user taps on the scroll to bottom button', () =>
      userRobot.tapOnScrollToBottomButton(),
    );
    await step('THEN message list is scrolled down', () =>
      userRobot.assertMessage(newMessage).assertScrollToBottomButton(false),
    );
  });

  it('test_reloadsSkippedMessages_whenScrolledToTheBottom', async () => {
    allureId(13165);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 30 });
      await userRobot.login().openChannel();
    });
    await step('AND user scrolls up', () => userRobot.scrollMessageListUp());
    await step('AND participant sends some messages', () =>
      participantRobot.sendMultipleMessages('Some message', 16),
    );
    await step('WHEN user scrolls to the bottom', () => userRobot.tapOnScrollToBottomButton());
    await step('THEN skipped messages are reloaded', () =>
      userRobot.assertMessage('Some message-16').assertScrollToBottomButton(false),
    );
  });

  it('test_paginationOnMessageList', async () => {
    allureId(13166);
    const messagesCount = 60;
    await step('WHEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step('THEN user makes sure that chat history is loaded', () =>
      userRobot.assertMessageListPagination(messagesCount),
    );
  });

  it('test_paginationOnThread', async () => {
    allureId(13167);
    const repliesCount = 60;
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1, repliesCount });
      await userRobot.login().openChannel();
    });
    await step('WHEN user opens the thread', () => userRobot.openThread(0, false));
    await step('THEN user makes sure that thread history is loaded', () =>
      userRobot.assertMessageListPagination(repliesCount),
    );
  });

  // MARK: Mentions

  it('test_mentionsView', async () => {
    allureId(13168);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step("WHEN user types '@'", () => userRobot.typeText('@'));
    await step('THEN composer mention view appears', () =>
      userRobot.assertComposerMentionsMenu(true),
    );
    await step("WHEN user removes '@'", () => userRobot.clearComposer());
    await step('THEN composer mention view disappears', () =>
      userRobot.assertComposerMentionsMenu(false),
    );
  });

  it('test_userFillsTheComposerMentioningParticipantThroughMentionsView', async () => {
    allureId(13169);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step("WHEN user taps on participant's name", () =>
      userRobot.mentionParticipant({ send: false }),
    );
    await step("THEN composer fills in participant's name", () =>
      userRobot.assertMentionWasApplied(),
    );
  });

  // MARK: Thread replies

  it('test_threadReplyAppearsInThread_whenParticipantAddsThreadReply', async () => {
    allureId(13170);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant adds a thread reply', () =>
      participantRobot.sendMessageInThread(sampleText, false),
    );
    await step('AND user enters thread', () =>
      userRobot.assertThreadReplyLabelOnParentMessage().openThread(0, false),
    );
    await step('THEN user observes the thread reply in thread', () =>
      userRobot.assertThreadMessage(sampleText),
    );
  });

  it('test_threadReplyAppearsInChannelAndThread_whenParticipantAddsThreadReplySentAlsoToChannel', async () => {
    allureId(13171);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant adds a thread reply and also sends it to the channel', () =>
      participantRobot.sendMessageInThread(sampleText, true),
    );
    await step('THEN user observes the thread reply in channel', () =>
      userRobot.assertMessage(sampleText).assertAlsoInTheChannelLabelInChannel(),
    );
    await step('WHEN user enters thread', () => userRobot.openThread(0, false));
    await step('THEN user observes the thread reply in thread', () =>
      userRobot.assertThreadMessage(sampleText).assertAlsoInTheChannelLabelInThread(),
    );
  });

  it('test_threadReplyAppearsInChannelAndThread_whenUserAddsThreadReplySentAlsoToChannel', async () => {
    allureId(13172);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user adds a thread reply and sends it also to the main channel', () =>
      userRobot.openThread().sendMessageInThread(sampleText, true),
    );
    await step('THEN user observes the thread reply in thread', () =>
      userRobot.assertThreadMessage(sampleText).assertAlsoInTheChannelLabelInThread(),
    );
    await step('AND user observes the thread reply in channel', () =>
      userRobot.tapOnBackButton().assertMessage(sampleText).assertAlsoInTheChannelLabelInChannel(),
    );
  });

  // MARK: Message deleting

  it('test_userDeletesMessage', async () => {
    allureId(13173);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user deletes the message', () => userRobot.deleteMessage());
    await step('THEN the message is deleted', () =>
      userRobot.assertDeletedMessage(sampleText).assertMessageAuthor(true),
    );
  });

  // https://linear.app/stream/issue/RN-504
  it.skip('test_userHardDeletesMessage', async () => {
    allureId(13320);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user hard-deletes the message', () => userRobot.deleteMessage(0, true));
    await step('THEN the message is hard-deleted', () =>
      userRobot.assertDeletedMessage(sampleText, true),
    );
  });

  it('test_participantDeletesMessage', async () => {
    allureId(13174);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND participant deletes the message', () => participantRobot.deleteMessage());
    await step('THEN the message is deleted', () =>
      userRobot.assertDeletedMessage(sampleText).assertMessageAuthor(false),
    );
  });

  it('test_participantHardDeletesMessage', async () => {
    allureId(13175);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND participant hard-deletes the message', () =>
      participantRobot.deleteMessage(true),
    );
    await step('THEN the message is hard-deleted', () =>
      userRobot.assertDeletedMessage(sampleText, true),
    );
  });

  // https://linear.app/stream/issue/RN-478
  it.skip('test_threadReplyIsRemovedEverywhere_whenParticipantRemovesItFromChannel', async () => {
    allureId(13176);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step(
      'AND participant adds a thread reply and sends it also to main channel',
      async () => {
        await participantRobot.sendMessageInThread(sampleText, true);
        await userRobot.assertMessage(sampleText);
      },
    );
    await step('WHEN participant removes the thread reply', () => participantRobot.deleteMessage());
    await step('THEN user observes the thread reply removed in channel', () =>
      userRobot.assertDeletedMessage(sampleText).assertAlsoInTheChannelLabelInChannel(),
    );
    await step('AND user observes the thread reply removed in thread', () =>
      userRobot
        .openThread(0, false)
        .assertDeletedMessage(sampleText)
        .assertAlsoInTheChannelLabelInThread(),
    );
  });

  // https://linear.app/stream/issue/RN-478
  it.skip('test_threadReplyIsRemovedEverywhere_whenUserRemovesItFromChannel', async () => {
    allureId(13177);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a thread reply and sends it also to main channel', () =>
      userRobot.openThread().sendMessageInThread(sampleText, true).assertMessage(sampleText),
    );
    await step('WHEN user removes thread reply from channel', () =>
      userRobot.tapOnBackButton().assertMessage(sampleText).deleteMessage(),
    );
    await step('THEN user observes the thread reply removed in channel', () =>
      userRobot.assertDeletedMessage(sampleText).assertAlsoInTheChannelLabelInChannel(),
    );
    await step('AND user observes the thread reply removed in thread', () =>
      userRobot
        .openThread(0, false)
        .assertDeletedMessage(sampleText)
        .assertAlsoInTheChannelLabelInThread(),
    );
  });

  it('test_threadReplyIsRemovedEverywhere_whenParticipantRemovesItFromThread', async () => {
    allureId(13178);
    const message = 'message';
    const threadReply = 'thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step(
      "WHEN participant adds a thread reply to user's message and sends it also to main channel",
      () => participantRobot.sendMessageInThread(threadReply, true),
    );
    await step('AND user opens the thread', () =>
      userRobot.openThread(0, false).assertThreadMessage(threadReply),
    );
    await step('AND participant removes the thread reply from thread', () =>
      participantRobot.deleteMessage(),
    );
    await step('THEN the message is deleted from the thread', () =>
      userRobot.assertDeletedMessage(threadReply),
    );
    await step('AND the message is deleted from the channel', () =>
      userRobot.tapOnBackButton().assertDeletedMessage(threadReply),
    );
  });

  it('test_participantRemovesThreadReply', async () => {
    allureId(13179);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND participant adds a thread reply', () =>
      participantRobot.sendMessageInThread(sampleText, false),
    );
    await step('WHEN participant removes the thread reply', () => participantRobot.deleteMessage());
    await step('THEN user observes the thread reply removed in thread', () =>
      userRobot
        .assertThreadReplyLabelOnParentMessage()
        .openThread(0, false)
        .assertDeletedMessage(sampleText),
    );
  });

  // https://linear.app/stream/issue/RN-478
  it.skip('test_threadReplyIsRemovedEverywhere_whenUserRemovesItFromThread', async () => {
    allureId(13180);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a thread reply and sends it also to main channel', () =>
      userRobot.openThread().sendMessageInThread(sampleText, true).assertMessage(sampleText),
    );
    await step('WHEN user removes thread reply from thread', () => userRobot.deleteMessage());
    await step('THEN user observes the thread reply removed in thread', () =>
      userRobot.assertDeletedMessage(sampleText).assertAlsoInTheChannelLabelInThread(),
    );
    await step('AND user observes the thread reply removed in channel', () =>
      userRobot
        .tapOnBackButton()
        .assertDeletedMessage(sampleText)
        .assertAlsoInTheChannelLabelInChannel(),
    );
  });

  it('test_userRemovesThreadReply', async () => {
    allureId(13181);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a thread reply', () =>
      userRobot.openThread().sendMessageInThread(sampleText, false).assertMessage(sampleText),
    );
    await step('WHEN user removes the thread reply', () => userRobot.deleteMessage());
    await step('THEN user observes the thread reply removed in thread', () =>
      userRobot.assertDeletedMessage(sampleText),
    );
    await step('AND user observes a thread reply count button in channel', () =>
      userRobot.tapOnBackButton().assertThreadReplyLabelOnParentMessage(),
    );
  });

  // https://linear.app/stream/issue/RN-478
  it.skip('test_threadIsNotLocked_afterParentMessageDeletedByUser', async () => {
    allureId(13182);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND participant adds a message in thread', () =>
      participantRobot.sendMessageInThread(sampleText),
    );
    await step('WHEN user deletes a parent message', () =>
      userRobot.assertThreadReplyLabelOnParentMessage().deleteMessage(),
    );
    await step('THEN thread is not locked', () =>
      userRobot.openThread(0, false).assertMessage(sampleText),
    );
  });

  // https://linear.app/stream/issue/RN-478
  it.skip('test_threadIsNotLocked_afterParentMessageDeletedByParticipant', async () => {
    allureId(13183);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user sends a message in thread', () =>
      userRobot.openThread().sendMessage(sampleText).assertMessage(sampleText).tapOnBackButton(),
    );
    await step('WHEN participant deletes a parent message', () => participantRobot.deleteMessage());
    await step('THEN thread is not locked', () =>
      userRobot.openThread(0, false).assertMessage(sampleText),
    );
  });

  // MARK: Message grouping

  // https://linear.app/stream/issue/RN-496
  it.skip('test_messageEndsGroup_whenFollowedByErrorMessage', async () => {
    allureId(13184);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends the 1st message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND the timestamp is shown under the 1st message', () =>
      userRobot.assertMessageTimestamps(1),
    );
    await step('WHEN user sends a message that does not pass moderation', () =>
      userRobot
        .sendMessage(forbiddenWord)
        .assertMessage('Message was blocked by moderation policies'),
    );
    await step('THEN messages are not grouped, 1st message shows the timestamp', () =>
      userRobot.assertMessage(sampleText).assertMessageTimestamps(1),
    );
  });

  it('test_messageRendersTimestampAgain_whenMessageLastInGroupIsHardDeleted', async () => {
    allureId(13185);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant inserts 3 group messages', async () => {
      await participantRobot.sendMessage('1').sendMessage('2').sendMessage('3');
      await userRobot.assertMessage('3').assertMessageTimestamps(1);
    });
    await step('WHEN participant hard deletes last message', () =>
      participantRobot.deleteMessage(true),
    );
    await step('THEN previous message should re-render timestamp', () =>
      userRobot.assertMessage('3', false).assertMessageTimestamps(1),
    );
  });

  it('test_messageRendersTimestampAgain_whenMessageLastInGroupIsSoftDeleted', async () => {
    allureId(13186);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant inserts 3 group messages', async () => {
      await participantRobot.sendMessage('1').sendMessage('2').sendMessage('3');
      await userRobot.assertMessage('3').assertMessageTimestamps(1);
    });
    await step('WHEN participant soft deletes last message', () =>
      participantRobot.deleteMessage(false),
    );
    await step('THEN previous message should re-render timestamp', () =>
      userRobot.assertDeletedMessage('3').assertMessageTimestamps(1),
    );
  });
});
