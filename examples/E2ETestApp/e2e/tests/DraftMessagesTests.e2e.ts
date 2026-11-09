import { describe, it } from '@jest/globals';

import { disableInternetConnection } from '../support/Device';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

describe('DraftMessagesTests', () => {
  const { backendRobot, userRobot } = setUpStreamTestCase();
  const firstMessage = 'message';
  const draftMessage = 'alright';

  it('test_updateChannelDraftMessage', async () => {
    allureId(13078);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(firstMessage).assertMessage(firstMessage),
    );
    await step('WHEN user inputs some text in the composer', () =>
      userRobot.typeText(draftMessage),
    );
    await step('AND user leaves the channel', () => userRobot.moveToChannelListFromMessageList());
    await step('THEN the draft message is in preview', () =>
      userRobot.assertDraftInChannelPreview(draftMessage),
    );
    await step('WHEN user comes back to the channel', () => userRobot.openChannel());
    await step('THEN the draft message is in the composer', () =>
      userRobot.assertComposerText(draftMessage),
    );
    await step('WHEN user deletes the draft message', () => userRobot.clearComposer());
    await step('AND user leaves the channel', () => userRobot.moveToChannelListFromMessageList());
    await step('THEN there is no draft message in preview', () =>
      userRobot.assertMessageInChannelPreview(firstMessage, true),
    );
    await step('WHEN user comes back to the channel', () => userRobot.openChannel());
    await step('THEN there is no draft message in the composer', () =>
      userRobot.assertComposerText(''),
    );
  });

  it('test_updateThreadDraftMessage', async () => {
    allureId(13079);
    await step('GIVEN user opens a thread', async () => {
      await backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 1,
        repliesCount: 1,
        repliesText: firstMessage,
      });
      await userRobot.login().openChannel().openThread(0, false);
    });
    await step('WHEN user inputs some text in the composer', () =>
      userRobot.typeText(draftMessage),
    );
    await step('AND user leaves the thread and comes back to it', () =>
      userRobot.tapOnBackButton().openThread(0, false),
    );
    await step('THEN the draft message is in the composer', () =>
      userRobot.assertComposerText(draftMessage),
    );
    await step('WHEN user deletes the draft message', () => userRobot.clearComposer());
    await step('AND user leaves the thread and comes back to it', () =>
      userRobot.tapOnBackButton().openThread(0, false),
    );
    await step('THEN there is no draft message in the composer', () =>
      userRobot.assertComposerText(''),
    );
  });

  itOnAndroid('test_updateDraftMessageBeingOffline', async () => {
    allureId(13080);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user becomes offline', () => disableInternetConnection());
    await step('WHEN user inputs some text in the composer', () =>
      userRobot.typeText(draftMessage),
    );
    await step('AND user leaves the channel', () => userRobot.moveToChannelListFromMessageList());
    await step('THEN the draft message is in preview', () =>
      userRobot.assertDraftInChannelPreview(draftMessage),
    );
    await step('WHEN user comes back to the channel', () => userRobot.openChannel());
    await step('THEN the draft message is in the composer', () =>
      userRobot.assertComposerText(draftMessage),
    );
  });
});
