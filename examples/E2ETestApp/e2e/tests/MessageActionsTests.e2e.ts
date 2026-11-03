import { describe, it } from '@jest/globals';

import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('MessageActionsTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase({ synchronization: false });
  const sampleText = 'Test';

  it('test_userCopiesMessage', async () => {
    allureId(13101);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user copies the message', () => userRobot.copyMessage());
    // The test runner can't read the device clipboard, so the copy is checked by pasting it.
    await step('THEN the message text is in the clipboard', () =>
      userRobot.pasteIntoComposer().assertComposerText(sampleText),
    );
  });
});
