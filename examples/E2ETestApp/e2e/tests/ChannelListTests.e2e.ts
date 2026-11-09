import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { disableInternetConnection, enableInternetConnection } from '../support/Device';
import { sleep } from '../support/Element';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

describe('ChannelListTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';
  const noMessages = 'No messages yet';
  const deletedMessage = 'Message deleted';

  it('test_channelListShowsGeneratedChannels', async () => {
    allureId(13060);
    await step('GIVEN backend has 3 channels', () =>
      backendRobot.generateChannels({ channelsCount: 3, channelNames: ['Alpha', 'Beta', 'Gamma'] }),
    );
    await step('WHEN user logs in', () => userRobot.login().waitForChannelListToLoad());
    await step('THEN user observes all channels in the list', () =>
      userRobot.assertChannelCount(3).assertChannelAvatar(),
    );
  });

  it('test_paginationOnChannelList', async () => {
    allureId(13061);
    const channelsCount = 30;
    await step('WHEN user opens the channel list', async () => {
      await backendRobot.generateChannels({ channelsCount });
      await userRobot.login().waitForChannelListToLoad();
    });
    await step('THEN user makes sure that all channels are loaded', () =>
      userRobot.assertChannelListPagination(channelsCount),
    );
  });

  it('test_channelPreviewUpdates_whenParticipantSendsMessage', async () => {
    allureId(13062);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('AND user goes back to the channel list', () =>
      userRobot.assertMessage(sampleText).moveToChannelListFromMessageList(),
    );
    await step('THEN user observes the new message in preview', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, false)
        .assertMessageDeliveryStatusInPreview(MessageDeliveryStatus.NIL)
        .assertChannelAvatar(),
    );
  });

  it('test_channelPreviewUpdates_whenUserSendsMessage', async () => {
    allureId(13063);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN user observes the new message in preview', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, true)
        .assertMessageDeliveryStatusInPreview(MessageDeliveryStatus.SENT)
        .assertChannelAvatar(),
    );
    await step('WHEN participant reads the message', () => participantRobot.readMessage());
    await step('THEN user observes the read status in preview', () =>
      userRobot.assertMessageDeliveryStatusInPreview(MessageDeliveryStatus.READ),
    );
  });

  itOnAndroid(
    'test_channelPreviewUpdates_whenUserIsOfflineAndParticipantSendsMessage',
    async () => {
      allureId(13064);
      const delay = 3;
      await step('GIVEN user opens a channel list', () =>
        userRobot.login().waitForChannelListToLoad(),
      );
      await step('AND user goes offline while participant sends a message', async () => {
        // Sent with a delay, because the mock server can't be reached while offline.
        await participantRobot.sendMessage(sampleText, delay);
        await disableInternetConnection();
        await sleep((delay + 1) * 1000);
      });
      await step('AND user goes back online', () => enableInternetConnection());
      await step('THEN user observes the new message in preview', () =>
        userRobot.assertMessageInChannelPreview(sampleText, false),
      );
    },
  );

  itOnAndroid('test_participantMessageShownInChannelPreview_whenReturningFromOffline', async () => {
    allureId(13065);
    await step('GIVEN user opens the channel and goes back', () =>
      userRobot.login().openChannel().moveToChannelListFromMessageList(),
    );
    await step('AND user becomes offline while participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText, 3);
      await disableInternetConnection();
      await sleep(4000);
    });
    await step('AND user becomes online', () => enableInternetConnection());
    await step("THEN list shows a preview of participant's message", () =>
      userRobot.assertMessageInChannelPreview(sampleText, false),
    );
  });

  itOnAndroid(
    'test_channelListIsReordered_whenParticipantSendsMessageInOldestChannelWhileUserIsOffline',
    async () => {
      allureId(13066);
      const oldestChannel = '3';
      await step('GIVEN user opens channel list', async () => {
        await backendRobot.generateChannels({ channelsCount: 3 });
        await userRobot.login().assertChannelName('1', 0).assertChannelName(oldestChannel, 2);
      });
      await step('AND user goes offline', () => disableInternetConnection());
      await step('WHEN participant sends a new message in the oldest channel', async () => {
        await participantRobot.sendMessageInChannelNamed(sampleText, oldestChannel);
        await sleep(2000);
      });
      await step('AND user comes back online', () => enableInternetConnection());
      await step('THEN channel list reorders accordingly', () =>
        userRobot
          .assertChannelName(oldestChannel, 0)
          .assertMessageInChannelPreview(sampleText, false),
      );
    },
  );

  // https://linear.app/stream/issue/RN-479
  it.skip('test_errorMessageIsNotShownInChannelPreview', async () => {
    allureId(13067);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('WHEN user sends a message with invalid command', () =>
      userRobot.sendMessage('/test').assertInvalidCommandMessage('test'),
    );
    await step('AND user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the error message is not shown in preview', () =>
      userRobot.assertMessageInChannelPreview(sampleText, false).assertMessagePreviewTimestamp(),
    );
  });

  // https://linear.app/stream/issue/RN-479
  it.skip('test_errorMessageIsNotShownInChannelPreview_whenErrorMessageIsReceived', async () => {
    allureId(13068);
    const message = 'message';
    const invalidCommand = 'invalid command';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message with invalid command', () =>
      userRobot
        .sendMessage(message)
        .assertMessage(message)
        .sendMessage(`/${invalidCommand}`)
        .assertInvalidCommandMessage(invalidCommand),
    );
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the error message is not shown in preview', () =>
      userRobot.assertMessageInChannelPreview(message, true),
    );
    await step('AND last message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  it('test_channelPreviewShowsNoMessages_whenChannelIsEmpty', async () => {
    allureId(13069);
    await step('WHEN user opens channel list', () => userRobot.login().waitForChannelListToLoad());
    await step('THEN the channel preview shows the empty state', () =>
      userRobot.assertMessageInChannelPreview(noMessages),
    );
    await step('AND the message timestamp is hidden', () =>
      userRobot.assertMessagePreviewTimestamp(false),
    );
  });

  // https://linear.app/stream/issue/RN-494
  it.skip('test_channelPreviewShowsMessageDeleted_whenTheOnlyMessageInChannelIsDeleted', async () => {
    allureId(13070);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND participant deletes the message', async () => {
      await participantRobot.deleteMessage();
      await userRobot.assertDeletedMessage(sampleText);
    });
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows the deleted message placeholder', () =>
      userRobot.assertMessageInChannelPreview(deletedMessage, false),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  // https://linear.app/stream/issue/RN-494
  it.skip('test_channelPreviewShowsMessageDeleted_whenLastMessageIsDeleted', async () => {
    allureId(13071);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends 2 messages', async () => {
      await participantRobot.sendMessage('Old').sendMessage('New');
      await userRobot.assertMessage('New');
    });
    await step('AND participant deletes the last message', async () => {
      await participantRobot.deleteMessage();
      await userRobot.assertDeletedMessage('New');
    });
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows the deleted message placeholder', () =>
      userRobot.assertMessageInChannelPreview(deletedMessage, false),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  // https://linear.app/stream/issue/RN-494
  it.skip('test_channelPreviewShowsDeletedMessage', async () => {
    allureId(13072);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends 2 messages', () =>
      userRobot
        .sendMessage('Previous message')
        .assertMessage('Previous message')
        .sendMessage('Last message')
        .assertMessage('Last message'),
    );
    await step('AND user deletes the last message', () =>
      userRobot.deleteMessage().assertDeletedMessage('Last message'),
    );
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows deleted message', () =>
      userRobot.assertMessageInChannelPreview(deletedMessage, true),
    );
  });

  it('test_channelPreviewIsNotUpdated_whenThreadReplyIsSent', async () => {
    allureId(13073);
    const channelMessage = 'Channel message';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(channelMessage);
      await userRobot.assertMessage(channelMessage);
    });
    await step('AND participant adds thread reply to this message', async () => {
      await participantRobot.sendMessageInThread('Thread reply');
      await userRobot.assertThreadReplyLabelOnParentMessage();
    });
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows the channel message preview', () =>
      userRobot.assertMessageInChannelPreview(channelMessage, false),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  it('test_channelPreviewIsUpdated_whenThreadReplyIsSentAlsoInTheChannel', async () => {
    allureId(13074);
    const threadReply = 'Thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage('Channel message').assertMessage('Channel message'),
    );
    await step('AND user adds thread reply to this message also in the channel', () =>
      userRobot.openThread().sendMessageInThread(threadReply, true).assertMessage(threadReply),
    );
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromThread(),
    );
    await step('THEN the channel preview shows the thread message preview', () =>
      userRobot.assertMessageInChannelPreview(threadReply, true),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  it('test_channelPreviewIsUpdated_whenPreviewMessageIsEdited', async () => {
    allureId(13075);
    const editedMessage = 'edited message';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('WHEN participant edits the message', async () => {
      await participantRobot.editMessage(editedMessage);
      await userRobot.assertMessage(editedMessage);
    });
    await step('AND user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows edited message', () =>
      userRobot.assertMessageInChannelPreview(editedMessage, false),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  // https://linear.app/stream/issue/RN-495
  it.skip('test_messageList_and_channelPreview_AreUpdatedWhenChannelTruncatedWithMessage', async () => {
    allureId(13076);
    const message = 'Channel truncated';
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 42 });
      await userRobot.login().openChannel().assertMessage('42');
    });
    await step('WHEN the channel is truncated with a system message', () =>
      backendRobot.truncateChannel(true),
    );
    await step('THEN user observes only the system message', () =>
      userRobot
        .assertSystemMessage(message)
        .assertMessageCount(0)
        .assertScrollToBottomButton(false)
        .assertScrollToBottomButtonUnreadCount(0),
    );
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview shows the system message', () =>
      userRobot.assertMessageInChannelPreview(message, true),
    );
    await step('AND the message timestamp is shown', () =>
      userRobot.assertMessagePreviewTimestamp(true),
    );
  });

  it('test_messageList_and_channelPreview_AreUpdatedWhenChannelTruncatedWithoutMessage', async () => {
    allureId(13077);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 42 });
      await userRobot.login().openChannel().assertMessage('42');
    });
    await step('WHEN the channel is truncated without a system message', () =>
      backendRobot.truncateChannel(false),
    );
    await step('THEN user observes an empty message list', () =>
      userRobot
        .assertMessageCount(0)
        .assertSystemMessage('Channel truncated', false)
        .assertScrollToBottomButton(false)
        .assertScrollToBottomButtonUnreadCount(0),
    );
    await step('WHEN user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview is empty', () =>
      userRobot.assertMessageInChannelPreview(noMessages),
    );
    await step('AND the message timestamp is hidden', () =>
      userRobot.assertMessagePreviewTimestamp(false),
    );
  });
});
