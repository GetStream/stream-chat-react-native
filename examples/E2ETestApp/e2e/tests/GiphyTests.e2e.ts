import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('GiphyTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();

  it('test_userObservesAnimatedGiphy_whenUserAddsGiphyMessage', async () => {
    allureId(13081);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a giphy using giphy command', () => userRobot.uploadGiphy());
    await step('THEN user observes the animated gif', () =>
      userRobot.assertGiphyImage().assertGiphyButtons(false),
    );
  });

  it('test_userObservesAnimatedGiphy_whenParticipantAddsGiphyMessage', async () => {
    allureId(13082);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a giphy', () => participantRobot.uploadGiphy());
    await step('THEN user observes the animated gif', () => userRobot.assertGiphyImage());
  });

  it('test_userObservesAnimatedGiphy_whenUserAddsGiphyMessageInThread', async () => {
    allureId(13083);
    await step('GIVEN user opens a channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user runs a giphy command in thread', () =>
      userRobot.openThread().uploadGiphy(),
    );
    await step('THEN user observes the animated gif in thread', () => userRobot.assertGiphyImage());
  });

  it('test_userObservesAnimatedGiphy_whenParticipantAddsGiphyMessageInThread', async () => {
    allureId(13084);
    await step('GIVEN user opens a channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant sends a giphy', async () => {
      await participantRobot.uploadGiphyInThread();
      await userRobot.assertThreadReplyLabelOnParentMessage();
    });
    await step('THEN user observes the animated gif in thread', () =>
      userRobot.openThread(0, false).assertGiphyImage(),
    );
  });

  it('test_userObservesAnimatedGiphy_afterAddingGiphyThroughComposerMenu', async () => {
    allureId(13085);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a giphy using the command suggestions', () =>
      userRobot.uploadGiphy({ useComposerCommand: true }),
    );
    await step('THEN user observes the animated gif', () => userRobot.assertGiphyImage());
  });

  it('test_userObservesAnimatedGiphy_whenUserAddsGiphyMessage_AfterShuffling', async () => {
    allureId(13086);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user shuffles a giphy', () =>
      userRobot.uploadGiphy({ send: false }).tapOnShuffleGiphyButton(),
    );
    await step('THEN the giphy is shuffled but not sent', () =>
      userRobot.assertGiphyImage(true).assertGiphyButtons(true),
    );
    await step('WHEN user sends a giphy', () => userRobot.tapOnSendGiphyButton());
    await step('THEN user observes the animated gif', () =>
      userRobot.assertGiphyImage(true).assertGiphyButtons(false),
    );
  });

  it('test_messageIsNotSent_whenUserCancelsEphemeralMessage', async () => {
    allureId(13087);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user cancels a giphy', () =>
      userRobot.uploadGiphy({ send: false }).assertGiphyButtons(true).tapOnCancelGiphyButton(),
    );
    await step('THEN user does not observe the animated gif', () =>
      userRobot.assertGiphyImage(false).assertGiphyButtons(false),
    );
  });

  // https://linear.app/stream/issue/RN-496
  it.skip('test_messageIsNotSent_whenUserSendsInvalidCommand', async () => {
    allureId(13088);
    const invalidCommand = 'invalid command';
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user sends a message with invalid command', () =>
      userRobot.sendMessage(`/${invalidCommand}`),
    );
    await step('THEN user observes error message', () =>
      userRobot.assertInvalidCommandMessage(invalidCommand),
    );
    await step('AND the previous message has timestamp and delivery status shown', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.SENT).assertMessageTimestamps(1),
    );
  });

  // https://linear.app/stream/issue/RN-479
  it.skip('test_channelListNotModified_whenEphemeralMessageShown', async () => {
    allureId(13089);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user runs a giphy command', () =>
      userRobot.uploadGiphy({ send: false }).assertGiphyButtons(true),
    );
    await step('AND user goes back to channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN message is not added to the channel list', () =>
      userRobot.assertMessageInChannelPreview('No messages yet'),
    );
  });

  it('test_deliveryStatusHidden_whenEphemeralMessageShown', async () => {
    allureId(13090);
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user runs a giphy command', () =>
      userRobot.uploadGiphy({ send: false }).assertGiphyButtons(true),
    );
    await step('THEN delivery status is hidden for ephemeral messages', () =>
      userRobot
        .assertMessageDeliveryStatus(MessageDeliveryStatus.NIL)
        .assertSystemMessage('Only visible to you'),
    );
  });

  it('test_deliveryStatusHidden_whenEphemeralMessageShownInThread', async () => {
    allureId(13091);
    await step('GIVEN user opens a channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user runs a giphy command in thread', () =>
      userRobot.openThread().uploadGiphy({ send: false }).assertGiphyButtons(true),
    );
    await step('THEN delivery status is hidden for ephemeral messages', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.NIL),
    );
  });
});
