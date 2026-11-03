import { describe, it } from '@jest/globals';

import { AttachmentType } from '../mock-server/DataTypes';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('QuotedReplyTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test message';
  const quoteReply = 'Alright';
  const messagesCount = 30;
  const firstMessage = '1';
  const deletedText = 'Message deleted';
  const invalidCommand = 'invalid command';

  /** A channel with one message (`sampleText` unless given) and `repliesCount` thread replies. */
  const openChannelWithThread = async (repliesCount: number, messagesText = sampleText) => {
    await backendRobot.generateChannels({
      channelsCount: 1,
      messagesCount: 1,
      messagesText,
      repliesCount,
    });
    await userRobot.login().openChannel().assertMessage(messagesText);
  };

  // MARK: Channel

  it('test_whenSwipingMessage_thenMessageIsQuotedReply', async () => {
    allureId(13209);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        messagesText: sampleText,
      });
      await userRobot.login().openChannel().assertMessage(sampleText);
    });
    await step('WHEN user swipes a message', () => userRobot.swipeMessage());
    await step('AND user sends a message', () => userRobot.sendMessage(quoteReply));
    await step('THEN a quote reply is sent', () =>
      userRobot.assertQuotedMessage({ quote: sampleText, text: quoteReply }),
    );
  });

  it('test_quotedReplyInList_whenUserAddsQuotedReply', async () => {
    allureId(13210);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step("WHEN user adds a quoted reply to participant's message", () =>
      userRobot.quoteMessage(quoteReply),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertQuotedMessage({ quote: sampleText, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
  });

  it('test_quotedReplyInList_whenParticipantAddsQuotedReply_Message', async () => {
    allureId(13211);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step("WHEN participant adds a quoted reply to user's message", () =>
      participantRobot.quoteMessage(quoteReply),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertQuotedMessage({ quote: '1', text: quoteReply })
        .assertScrollToBottomButton(false),
    );
  });

  it('test_quotedReplyNotInList_whenUserAddsQuotedReply', async () => {
    allureId(13212);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step('WHEN user adds a quoted reply to message', () =>
      userRobot
        .scrollMessageListUpToMessage(firstMessage, 15)
        .quoteMessageWithText(quoteReply, firstMessage),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_Message', async () => {
    allureId(13213);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step("WHEN participants adds a quoted reply to user's message", () =>
      participantRobot.quoteMessage(quoteReply, false),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_File', async () => {
    allureId(13214);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step("WHEN participants adds a quoted reply to user's message with a file", () =>
      participantRobot.quoteMessageWithAttachment(AttachmentType.FILE, 1, false),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertFile(true)
        .assertQuotedMessage({ quote: firstMessage })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_Giphy', async () => {
    allureId(13215);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step("WHEN participants adds a quoted reply to user's message with a giphy", () =>
      participantRobot.quoteMessageWithGiphy(false),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .assertGiphyImage(true)
        .assertQuotedMessage({ quote: firstMessage })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertGiphyImage(false)
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyIsDeletedByParticipant_deletedMessageIsShown', async () => {
    allureId(13216);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND participant adds a quoted reply', async () => {
      await participantRobot.quoteMessage(quoteReply);
      await userRobot.assertQuotedMessage({ quote: '1', text: quoteReply });
    });
    await step('WHEN participant deletes a quoted message', () => participantRobot.deleteMessage());
    await step('THEN user observes Message deleted', () =>
      userRobot
        .assertDeletedMessage(quoteReply)
        .assertQuotedMessage({ isDisplayed: false, text: quoteReply }),
    );
  });

  it('test_originalQuoteIsDeletedByParticipant_deletedMessageIsShown', async () => {
    allureId(13217);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage('1');
      await userRobot.assertMessage('1');
    });
    await step('AND user adds a quoted reply', () =>
      userRobot.quoteMessage(quoteReply).assertQuotedMessage({ quote: '1', text: quoteReply }),
    );
    await step('WHEN participant deletes an original message', () =>
      participantRobot.deleteMessage(),
    );
    await step('THEN deleted message is shown', () => userRobot.assertDeletedMessage('1'));
    await step('AND deleted message is shown in quoted reply bubble', () =>
      userRobot.assertQuotedMessage({ quote: deletedText, text: quoteReply }),
    );
  });

  it('test_quotedReplyIsDeletedByUser_deletedMessageIsShown', async () => {
    allureId(13218);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a quoted reply', () =>
      userRobot.quoteMessage(quoteReply).assertQuotedMessage({ quote: '1', text: quoteReply }),
    );
    await step('WHEN user deletes a quoted message', () =>
      userRobot.deleteMessageWithText(quoteReply),
    );
    await step('THEN user observes Message deleted', () =>
      userRobot
        .assertDeletedMessage(quoteReply)
        .assertQuotedMessage({ isDisplayed: false, text: quoteReply }),
    );
  });

  it('test_originalQuoteIsDeletedByUser_deletedMessageIsShown', async () => {
    allureId(13219);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        messagesText: sampleText,
      });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a quoted reply', () =>
      userRobot
        .quoteMessage(quoteReply)
        .assertQuotedMessage({ quote: sampleText, text: quoteReply }),
    );
    await step('WHEN user deletes an original message', () =>
      userRobot.deleteMessageWithText(sampleText),
    );
    await step('THEN deleted message is shown', () => userRobot.assertDeletedMessage(sampleText));
    await step('AND deleted message is shown in quoted reply bubble', () =>
      userRobot.assertQuotedMessage({ quote: deletedText, text: quoteReply }),
    );
  });

  // https://linear.app/stream/issue/RN-496
  it.skip('test_userAddsQuotedReplyWithInvalidCommand', async () => {
    allureId(13220);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step('WHEN user quotes a message with invalid command', () =>
      userRobot.quoteMessage(`/${invalidCommand}`),
    );
    await step('THEN user observes invalid command alert', () =>
      userRobot
        .assertInvalidCommandMessage(invalidCommand)
        .assertQuotedMessage({ isDisplayed: false, text: quoteReply }),
    );
  });

  // https://linear.app/stream/issue/RN-496
  it.skip('test_unreadCount_whenUserSendsInvalidCommand_and_jumpingOnQuotedMessage', async () => {
    allureId(13221);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount });
      await userRobot.login().openChannel();
    });
    await step('WHEN user adds a quoted reply to participant message', () =>
      userRobot
        .scrollMessageListUpToMessage(firstMessage, 15)
        .quoteMessageWithText(quoteReply, firstMessage)
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply }),
    );
    await step('AND user quotes a message with invalid command', () =>
      userRobot.quoteMessageWithText(`/${invalidCommand}`, quoteReply),
    );
    await step('THEN user observes invalid command alert', () =>
      userRobot.assertInvalidCommandMessage(invalidCommand),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quoted message', () =>
      userRobot.assertScrollToBottomButton(true).assertScrollToBottomButtonUnreadCount(0),
    );
  });

  // MARK: Jumping

  // Fails on some runs: the list stays on the jumped page (https://linear.app/stream/issue/RN-506).
  it('test_messageListScrollsToLatest_whenUserSendsMessageAfterJumpingToQuotedMessage', async () => {
    allureId(13222);
    const quotedText = '30';
    const newMessage = 'New message after jump';
    await step('GIVEN user opens a channel with 60 messages', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 60 });
      await userRobot.login().openChannel();
    });
    await step('AND user quotes a mid-page message', () =>
      userRobot
        .scrollMessageListUpToMessage(quotedText, 15)
        .quoteMessageWithText(quoteReply, quotedText)
        .assertQuotedMessage({ quote: quotedText, text: quoteReply }),
    );
    await step('AND user closes and reopens the channel', () =>
      userRobot.moveToChannelListFromMessageList().openChannel(),
    );
    await step('WHEN user taps on the quoted message', () =>
      userRobot.tapOnQuotedMessage().assertScrollToBottomButton(true),
    );
    await step('AND user sends a new message', () => userRobot.sendMessage(newMessage));
    await step('THEN message list shows the latest message', () =>
      userRobot.assertMessage(newMessage).assertScrollToBottomButton(false),
    );
  });

  it('test_messageListScrollsToLatest_whenUserTapsScrollToBottomAfterJumpingToQuotedMessage', async () => {
    allureId(13223);
    const quotedText = '30';
    await step('GIVEN user opens a channel with 60 messages', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 60 });
      await userRobot.login().openChannel();
    });
    await step('AND user quotes a mid-page message', () =>
      userRobot
        .scrollMessageListUpToMessage(quotedText, 15)
        .quoteMessageWithText(quoteReply, quotedText)
        .assertQuotedMessage({ quote: quotedText, text: quoteReply }),
    );
    await step('AND user closes and reopens the channel', () =>
      userRobot.moveToChannelListFromMessageList().openChannel(),
    );
    await step('WHEN user taps on the quoted message', () =>
      userRobot.tapOnQuotedMessage().assertScrollToBottomButton(true),
    );
    await step('AND user taps on the scroll to bottom button', () =>
      userRobot.tapOnScrollToBottomButton(),
    );
    await step('THEN message list shows the latest message', () =>
      userRobot.assertMessage(quoteReply).assertScrollToBottomButton(false),
    );
  });

  it('test_channelPreviewDoesNotChange_whenUserLeavesChannelAfterJumpingToMidPage', async () => {
    allureId(13224);
    const quotedText = '30';
    await step('GIVEN user opens a channel with 60 messages', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 60 });
      await userRobot.login().openChannel();
    });
    await step('AND user quotes a mid-page message', () =>
      userRobot
        .scrollMessageListUpToMessage(quotedText, 15)
        .quoteMessageWithText(quoteReply, quotedText)
        .assertQuotedMessage({ quote: quotedText, text: quoteReply }),
    );
    await step('AND user reopens the channel', () =>
      userRobot
        .moveToChannelListFromMessageList()
        .assertMessageInChannelPreview(quoteReply, true)
        .openChannel(),
    );
    await step('AND user jumps to a mid-page', () =>
      userRobot.tapOnQuotedMessage().assertScrollToBottomButton(true).assertMessage(quotedText),
    );
    await step('WHEN user leaves the channel', () => userRobot.moveToChannelListFromMessageList());
    await step('THEN the preview message does not change', () =>
      userRobot.assertMessageInChannelPreview(quoteReply, true),
    );
  });

  it('test_quotedMessageIsPresent_afterReenteringChannelAndLoadingNewMessages', async () => {
    allureId(13225);
    const quotedText = '30';
    await step('GIVEN user opens a channel with 60 messages', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 60 });
      await userRobot.login().openChannel();
    });
    await step('AND user quotes a message that is on an old page', () =>
      userRobot
        .scrollMessageListUpToMessage(quotedText, 15)
        .quoteMessageWithText(quoteReply, quotedText)
        .assertQuotedMessage({ quote: quotedText, text: quoteReply }),
    );
    await step('AND user leaves the channel and re-enters', () =>
      userRobot.moveToChannelListFromMessageList().openChannel(),
    );
    await step('WHEN user jumps to the quoted message', () =>
      userRobot.tapOnQuotedMessage().assertScrollToBottomButton(true).assertMessage(quotedText),
    );
    await step('AND user loads all the newest messages until reaching the bottom', () =>
      userRobot.scrollMessageListDownToMessage(quoteReply, 30).assertMessage(quoteReply),
    );
    await step('AND user scrolls back to the quoted message', () =>
      userRobot.scrollMessageListUpToMessage(quotedText, 30),
    );
    await step('THEN the quoted message is still there', () => userRobot.assertMessage(quotedText));
  });

  // MARK: Thread

  // https://linear.app/stream/issue/RN-490
  it.skip('test_whenUserAddsQuotedReply_InThread', async () => {
    allureId(13226);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        repliesCount: 1,
        repliesText: sampleText,
      });
      await userRobot.login().openChannel();
    });
    await step('WHEN user adds a quoted reply to message in thread', () =>
      userRobot
        .openThread(0, false)
        .assertMessage(sampleText)
        .quoteMessageWithText(quoteReply, sampleText),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .assertQuotedMessage({ quote: sampleText, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
  });

  it('test_whenParticipantAddsQuotedReply_InThread', async () => {
    allureId(13227);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user sends a message in thread', () =>
      userRobot.openThread().sendMessage(sampleText).assertMessage(sampleText),
    );
    await step("WHEN participant adds a quoted reply to user's message in thread", () =>
      participantRobot.quoteMessageInThread(quoteReply),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .assertQuotedMessage({ quote: sampleText, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_quotedReplyInList_whenUserAddsQuotedReply_InThread', async () => {
    allureId(13228);
    const repliesCount = 20;
    await step('GIVEN user opens the channel', () => openChannelWithThread(repliesCount));
    await step('WHEN user adds a quoted reply to participant message in thread', () =>
      userRobot
        .openThread(0, false)
        .scrollMessageListUpToMessage(firstMessage, 10)
        .quoteMessageWithText(quoteReply, firstMessage),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quoted message', () =>
      userRobot.assertMessage(firstMessage).assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyInList_whenParticipantAddsQuotedReply_Message_InThread', async () => {
    allureId(13229);
    const repliesCount = 25;
    await step('GIVEN user opens the channel', () => openChannelWithThread(repliesCount));
    await step('WHEN participant adds a quoted reply', () =>
      participantRobot.quoteMessageInThread(quoteReply, false, false),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .openThread(0, false)
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quoted message', () =>
      userRobot.assertMessage(firstMessage).assertScrollToBottomButton(true),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_quotedReplyNotInList_whenUserAddsQuotedReply_InThread', async () => {
    allureId(13230);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        repliesCount: messagesCount,
      });
      await userRobot.login().openChannel().waitForMessageListToLoad();
    });
    await step('WHEN user adds a quoted reply to message in thread', () =>
      userRobot
        .openThread(0, false)
        .scrollMessageListUpToMessage(firstMessage, 15)
        .quoteMessageWithText(quoteReply, firstMessage),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_Message_InThread', async () => {
    allureId(13231);
    await step('GIVEN user opens the channel', () => openChannelWithThread(messagesCount));
    await step("WHEN participants adds a quoted reply to user's message", () =>
      participantRobot.quoteMessageInThread(quoteReply, false, false),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .openThread(0, false)
        .assertQuotedMessage({ quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage, text: quoteReply })
        .assertScrollToBottomButton(true),
    );
  });

  /** A 90-reply thread whose first reply the participant quotes; the user jumps to the quote. */
  const jumpToTheFirstReplyInLongThread = async () => {
    await step('GIVEN a thread with more replies than two pages', () => openChannelWithThread(90));
    await step('AND participant adds a quoted reply to the first reply in thread', () =>
      participantRobot.quoteMessageInThread(quoteReply, false, false),
    );
    await step('AND user opens the thread and taps on the quoted message', () =>
      userRobot.openThread(0, false).tapOnQuotedMessage().assertMessage(firstMessage),
    );
  };

  it('test_threadShowsOnlyThePageAroundTheQuote_whenUserJumpsToQuotedReplyNotInList', async () => {
    allureId(13232);
    const newReply = 'New reply';
    const nextReply = 'Next reply';
    await jumpToTheFirstReplyInLongThread();
    await step('THEN the replies after the quote follow without a gap', () =>
      userRobot.scrollMessageListDownToMessage('32', 15).assertMessage('32'),
    );
    await step(
      'WHEN participant sends a new reply and user taps on the scroll to bottom button',
      async () => {
        await participantRobot.sendMessageInThread(newReply);
        await userRobot.tapOnScrollToBottomButton();
      },
    );
    await step('THEN user observes the new reply', () => userRobot.assertMessage(newReply));
    await step('WHEN participant sends another reply', () =>
      participantRobot.sendMessageInThread(nextReply),
    );
    await step('THEN user observes the other reply at the bottom', () =>
      userRobot.assertMessage(nextReply),
    );
  });

  // https://linear.app/stream/issue/RN-488
  it.skip('test_ownReplyIsShownWithTheNewestReplies_whenUserRepliesFromJumpedToPageInThread', async () => {
    allureId(13233);
    const ownReply = 'Own reply';
    await jumpToTheFirstReplyInLongThread();
    await step('WHEN user sends a reply', () => userRobot.sendMessageInThread(ownReply));
    await step('THEN user observes the reply right after the newest replies', () =>
      userRobot.assertMessage(ownReply).assertMessage('90'),
    );
  });

  it('test_replySentWhileOnJumpedToPage_isShown_whenUserScrollsDownToNewestReplies', async () => {
    allureId(13234);
    const newReply = 'New reply';
    await jumpToTheFirstReplyInLongThread();
    await step('WHEN participant sends a reply', () =>
      participantRobot.sendMessageInThread(newReply),
    );
    await step('AND user scrolls down to the newest replies', () =>
      userRobot.scrollMessageListDownToMessage(newReply, 30),
    );
    await step('THEN user observes the reply after the newest replies', () =>
      userRobot.assertMessage(newReply).assertMessage(quoteReply),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_File_InThread', async () => {
    allureId(13235);
    await step('GIVEN user opens the channel', () => openChannelWithThread(messagesCount));
    await step("WHEN participants adds a quoted reply to user's message with a file", () =>
      participantRobot.quoteMessageWithAttachmentInThread(AttachmentType.FILE, 1, false, false),
    );
    await step('THEN user observes the quote reply in thread', () =>
      userRobot
        .openThread(0, false)
        .assertFile(true)
        .assertQuotedMessage({ quote: firstMessage })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage })
        .assertScrollToBottomButton(true),
    );
  });

  it('test_quotedReplyNotInList_whenParticipantAddsQuotedReply_Giphy_InThread', async () => {
    allureId(13236);
    await step('GIVEN user opens the channel', () => openChannelWithThread(messagesCount));
    await step("WHEN participants adds a quoted reply to user's message with a giphy", () =>
      participantRobot.quoteMessageWithGiphyInThread(false, false),
    );
    await step('THEN user observes the quote reply in message list', () =>
      userRobot
        .openThread(0, false)
        .assertGiphyImage(true)
        .assertQuotedMessage({ quote: firstMessage })
        .assertScrollToBottomButton(false),
    );
    await step('WHEN user taps on a quoted message', () => userRobot.tapOnQuotedMessage());
    await step('THEN user is scrolled up to the quote', () =>
      userRobot
        .assertGiphyImage(false)
        .assertQuotedMessage({ isDisplayed: false, quote: firstMessage })
        .assertScrollToBottomButton(true),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_userAddsQuotedReplyWithInvalidCommand_InThread', async () => {
    allureId(13237);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1, repliesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user quotes a message with invalid command in thread', () =>
      userRobot.openThread(0, false).quoteMessage(`/${invalidCommand}`),
    );
    await step('THEN user observes invalid command alert', () =>
      userRobot
        .assertInvalidCommandMessage(invalidCommand)
        .assertQuotedMessage({ isDisplayed: false, text: quoteReply }),
    );
  });

  it('test_threadRepliesCount_One', async () => {
    allureId(13238);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant sends one thread reply', () =>
      participantRobot.sendMessageInThread(sampleText),
    );
    await step('THEN user observes one thread reply label in the channel', () =>
      userRobot.assertThreadReplyLabel(1),
    );
    await step('WHEN user opens the thread', () => userRobot.openThread(0, false));
    await step('THEN user observes one reply in the thread', () =>
      userRobot.assertThreadReplyLabel(1, true),
    );
  });

  it('test_threadRepliesCount_Multiple', async () => {
    allureId(13239);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant sends multiple thread replies', async () => {
      for (let i = 0; i < 5; i++) {
        await participantRobot.sendMessageInThread(`${sampleText} ${i}`);
      }
    });
    await step('THEN user observes the thread reply label in the channel', () =>
      userRobot.assertThreadReplyLabel(5),
    );
    await step('WHEN user opens the thread', () => userRobot.openThread(0, false));
    await step('THEN user observes all replies in the thread', () =>
      userRobot.assertThreadReplyLabel(5, true),
    );
  });

  it('test_quotedReplyInThreadAndAlsoInChannel', async () => {
    allureId(13240);
    const quotedText = `${messagesCount}`;
    await step('GIVEN user opens the channel', () => openChannelWithThread(messagesCount));
    await step('WHEN participant adds a quoted reply in thread and also in channel', () =>
      participantRobot.quoteMessageInThread(quoteReply, true),
    );
    await step('THEN user observes the quoted reply in channel', () =>
      userRobot
        .assertQuotedMessage({ quote: quotedText, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
    await step('AND user observes the quoted reply also in thread', () =>
      userRobot
        .openThread(0, false)
        .assertQuotedMessage({ quote: quotedText, text: quoteReply })
        .assertScrollToBottomButton(false),
    );
  });

  // https://linear.app/stream/issue/RN-487
  it.skip('test_jumpToQuotedMessageInThread_fromChannel', async () => {
    allureId(13241);
    await step('GIVEN user opens a channel with a thread', () => openChannelWithThread(10));
    await step('AND participant sends a quoted message in thread (also in channel)', async () => {
      await participantRobot.quoteMessageInThread(quoteReply, true, false);
      await userRobot.assertQuotedMessage({ quote: firstMessage, text: quoteReply });
    });
    await step('AND participant sends some more messages in thread', async () => {
      for (const reply of ['thread reply 1', 'thread reply 2', 'thread reply 3']) {
        await participantRobot.sendMessageInThread(reply);
      }
    });
    await step('WHEN user taps on the quoted message in channel', () =>
      userRobot.tapOnQuotedMessage(),
    );
    await step('THEN user jumps to the quoted message in thread', () =>
      userRobot.assertThreadIsOpen().assertMessage(firstMessage),
    );
  });

  it('test_jumpToRegularMessageInThread_fromChannel', async () => {
    allureId(13242);
    const threadReply = 'also in channel';
    await step('GIVEN user opens a channel with a thread', () => openChannelWithThread(10));
    await step('AND participant sends a regular message in thread (also in channel)', async () => {
      await participantRobot.sendMessageInThread(threadReply, true);
      await userRobot.assertMessage(threadReply);
    });
    await step('AND participant sends some more messages in thread', async () => {
      for (const reply of ['thread reply 1', 'thread reply 2', 'thread reply 3']) {
        await participantRobot.sendMessageInThread(reply);
      }
    });
    await step("WHEN user taps on 'View' in the header of the participant's message", () =>
      userRobot.tapOnSentToChannelHeaderLink(),
    );
    await step("THEN user jumps to the participant's message in thread", () =>
      userRobot.assertThreadIsOpen().assertMessage(threadReply),
    );
  });

  it('test_quotedReplyIsDeletedByParticipant_deletedMessageIsShown_InThread', async () => {
    allureId(13243);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND participant adds a quoted reply', async () => {
      await participantRobot.quoteMessageInThread(quoteReply);
      await userRobot.assertThreadReplyLabel(1);
    });
    await step('WHEN participant deletes a quoted message', () => participantRobot.deleteMessage());
    await step('THEN user observes Message deleted in thread', () =>
      userRobot.openThread(0, false).assertDeletedMessage(quoteReply),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_originalQuoteIsDeletedByParticipant_deletedMessageIsShown_InThread', async () => {
    allureId(13244);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessageInThread(sampleText);
      await userRobot.assertThreadReplyLabel(1);
    });
    await step('AND user adds a quoted reply', () =>
      userRobot
        .openThread(0, false)
        .assertMessage(sampleText)
        .quoteMessageWithText(quoteReply, sampleText)
        .assertQuotedMessage({ quote: sampleText, text: quoteReply }),
    );
    await step('WHEN participant deletes an original message', () =>
      participantRobot.deleteMessage(),
    );
    await step('THEN deleted message is shown', () => userRobot.assertDeletedMessage(sampleText));
    await step('AND deleted message is shown in quoted reply bubble', () =>
      userRobot.assertQuotedMessage({ quote: deletedText, text: quoteReply }),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_quotedReplyIsDeletedByUser_deletedMessageIsShown_InThread', async () => {
    allureId(13245);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        messagesText: sampleText,
      });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a quoted reply in thread', () =>
      userRobot
        .openThread()
        .quoteMessageWithText(quoteReply, sampleText)
        .assertQuotedMessage({ quote: sampleText, text: quoteReply }),
    );
    await step('WHEN user deletes a quoted message', () =>
      userRobot.deleteMessageWithText(quoteReply),
    );
    await step('THEN deleted message is shown', () =>
      userRobot.assertDeletedMessage(quoteReply).assertQuotedMessage({ isDisplayed: false }),
    );
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_originalQuoteIsDeletedByUser_deletedMessageIsShown_InThread', async () => {
    allureId(13246);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        messagesText: sampleText,
      });
      await userRobot.login().openChannel();
    });
    await step('AND user adds a quoted reply in thread', () =>
      userRobot
        .openThread()
        .quoteMessageWithText(quoteReply, sampleText)
        .assertQuotedMessage({ quote: sampleText, text: quoteReply }),
    );
    await step('WHEN user deletes an original message', () =>
      userRobot.deleteMessageWithText(sampleText),
    );
    await step('THEN deleted message is shown', () => userRobot.assertDeletedMessage(sampleText));
    await step('AND deleted message is shown in quoted reply bubble', () =>
      userRobot.assertQuotedMessage({ quote: deletedText, text: quoteReply }),
    );
  });

  it('test_rootMessageShouldOnlyBeVisibleInTheLastPageInThread', async () => {
    allureId(13247);
    await step('GIVEN user opens the channel', () => openChannelWithThread(messagesCount));
    await step('WHEN user opens the thread', () => userRobot.openThread(0, false));
    await step('THEN parent message is not loaded', () => userRobot.assertMessages(sampleText, 0));
    await step('WHEN user scrolls up to load one more page', () =>
      userRobot.scrollMessageListUpToMessage(sampleText, 15),
    );
    await step('THEN parent message is loaded', () => userRobot.assertMessages(sampleText, 1));
  });

  it('test_rootMessageShouldBeVisibleInThreadIfMessageCountLessThanPageSize', async () => {
    allureId(13248);
    await step('GIVEN user opens the channel', () => openChannelWithThread(24));
    await step('WHEN user opens the thread with 24 replies', () => userRobot.openThread(0, false));
    await step('THEN parent message is loaded', () =>
      userRobot.scrollMessageListUpToMessage(sampleText, 10).assertMessages(sampleText, 1),
    );
  });

  it('test_rootMessageShouldNotBeVisibleInThreadIfMessageCountEqualToPageSize', async () => {
    allureId(13249);
    await step('GIVEN user opens the channel', () => openChannelWithThread(25));
    await step('WHEN user opens the thread with 25 replies', () => userRobot.openThread(0, false));
    await step('THEN parent message is not loaded', () => userRobot.assertMessages(sampleText, 0));
    await step('WHEN user scrolls up to load one more page', () =>
      userRobot.scrollMessageListUpToMessage(sampleText, 15),
    );
    await step('THEN parent message is loaded', () => userRobot.assertMessages(sampleText, 1));
  });

  // https://linear.app/stream/issue/RN-490
  it.skip('test_quoteReplyRootMessageWhenNotInTheList', async () => {
    allureId(13250);
    await step('GIVEN user opens the thread', async () => {
      await openChannelWithThread(messagesCount);
      await userRobot.openThread(0, false);
    });
    await step('WHEN user quote replies root message', () =>
      userRobot
        .scrollMessageListUpToMessage(sampleText, 15)
        .quoteMessageWithText(quoteReply, sampleText),
    );
    await step('AND user reenters the thread', () =>
      userRobot.tapOnBackButton().openThread(0, false),
    );
    await step('AND user jumps to root message', () => userRobot.tapOnQuotedMessage());
    await step('THEN parent message is loaded', () =>
      userRobot
        .assertQuotedMessage({ isDisplayed: false, quote: sampleText, text: quoteReply })
        .assertScrollToBottomButton(true),
    );
  });
});
