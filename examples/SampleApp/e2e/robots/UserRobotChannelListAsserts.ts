import { expect as jestExpect } from '@jest/globals';

import { ParticipantRobot } from './ParticipantRobot';
import { UserRobot } from './UserRobot';

import { ChannelListPage } from '../pages/ChannelListPage';
import { waitForCount, waitForExistence, waitForText, waitToDisappear } from '../support/Element';

const { ChannelList } = ChannelListPage;
const { Channel } = ChannelList;

declare module './UserRobot' {
  interface UserRobot {
    assertChannelAvatar(): this;
    assertChannelCount(count: number): this;
    assertChannelListIsEmpty(): this;
    assertChannelName(name: string, channelCellIndex?: number): this;
    assertChannelUnreadCount(count: number): this;
    /**
     * @param fromCurrentUser `true` expects a "You: " prefix, `false` the participant's name,
     * `undefined` only the text.
     */
    assertMessageInChannelPreview(text: string, fromCurrentUser?: boolean): this;
  }
}

UserRobot.prototype.assertChannelAvatar = function () {
  return this.perform(async () => {
    jestExpect(await waitForExistence(Channel.avatar, { index: 0 })).toBe(true);
  });
};

UserRobot.prototype.assertChannelCount = function (count) {
  return this.perform(async () => {
    jestExpect(await waitForCount(ChannelList.channels, count)).toBe(count);
  });
};

UserRobot.prototype.assertChannelListIsEmpty = function () {
  return this.perform(async () => {
    await waitToDisappear(ChannelList.channels);
    jestExpect(await waitForCount(ChannelList.channels, 0)).toBe(0);
  });
};

UserRobot.prototype.assertChannelName = function (name, channelCellIndex = 0) {
  return this.perform(async () => {
    jestExpect(await waitForText(Channel.name, name, { index: channelCellIndex })).toBe(name);
  });
};

UserRobot.prototype.assertChannelUnreadCount = function (count) {
  return this.perform(async () => {
    jestExpect(await waitForText(Channel.unreadCount, `${count}`)).toBe(`${count}`);
  });
};

UserRobot.prototype.assertMessageInChannelPreview = function (text, fromCurrentUser) {
  const expectedSender =
    fromCurrentUser === true
      ? 'You:'
      : fromCurrentUser === false
        ? `${ParticipantRobot.userName}:`
        : undefined;
  return this.perform(async () => {
    const preview = await waitForText(Channel.messagePreview, text, { mustBeEqual: false });
    jestExpect(preview.trimEnd()).toContain(text);
    if (expectedSender !== undefined) {
      jestExpect(await waitForText(Channel.messageSender, expectedSender)).toBe(expectedSender);
    }
  });
};
