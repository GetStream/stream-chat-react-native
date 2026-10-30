import { describe, it } from '@jest/globals';

import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('ChannelListTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  it('test_channelListShowsGeneratedChannels', async () => {
    await step('GIVEN backend has 3 channels', () =>
      backendRobot.generateChannels({ channelsCount: 3, channelNames: ['Alpha', 'Beta', 'Gamma'] }),
    );
    await step('WHEN user logs in', () => userRobot.login().waitForChannelListToLoad());
    await step('THEN user observes all channels in the list', () =>
      userRobot.assertChannelCount(3).assertChannelAvatar(),
    );
  });

  it('test_channelPreviewUpdates_whenParticipantSendsMessage', async () => {
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('AND user goes back to the channel list', () =>
      userRobot.assertMessage(sampleText).moveToChannelListFromMessageList(),
    );
    await step('THEN user observes the new message in preview', () =>
      userRobot.assertMessageInChannelPreview(sampleText, false).assertChannelAvatar(),
    );
  });

  it('test_channelPreviewUpdates_whenUserSendsMessage', async () => {
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user goes back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN user observes the new message in preview', () =>
      userRobot.assertMessageInChannelPreview(sampleText, true),
    );
  });
});
