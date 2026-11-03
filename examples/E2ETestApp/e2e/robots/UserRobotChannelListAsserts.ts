import { expect as jestExpect } from '@jest/globals';

import { ParticipantRobot } from './ParticipantRobot';
import { UserRobot } from './UserRobot';
import { assertVisibility } from './UserRobotMessageListAsserts';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { ChannelListPage } from '../pages/ChannelListPage';
import {
  isDisplayed,
  waitForCount,
  waitForExistence,
  waitForText,
  waitToAppear,
  waitToDisappear,
} from '../support/Element';

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
    /** `NIL`: no status icon at all, as for a participant's last message. */
    assertMessageDeliveryStatusInPreview(status: MessageDeliveryStatus): this;
    assertFailedMessageDeliveryStatusInPreview(): this;
    assertMessagePreviewTimestamp(isDisplayed?: boolean): this;
    assertChannelWithName(name: string, isDisplayed?: boolean): this;
    assertChannelIsMuted(isMuted: boolean): this;
    assertDraftInChannelPreview(text: string): this;
    /** The sheet a group channel's "more" action opens. */
    assertChannelActionsSheetForGroupChannel(): this;
    assertGroupChannelInfoScreen(): this;
    assertPinnedMessagesScreen(): this;
    assertMessageInPinnedMessages(text: string): this;
    assertPinnedMessagesAreEmpty(): this;
    assertThreadListIsEmpty(): this;
    assertThreadInThreadList(parentMessageText: string, replies: number): this;
    /** Scrolls down from the newest generated channel ("1") until the oldest ("N") shows. */
    assertChannelListPagination(channelsCount: number): this;
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
    if (count === 0) {
      await assertVisibility(Channel.unreadCount, false);
      return;
    }
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

UserRobot.prototype.assertMessageDeliveryStatusInPreview = function (status) {
  return this.perform(async () => {
    switch (status) {
      case MessageDeliveryStatus.PENDING:
        return assertVisibility(Channel.deliveryStatus('sending'), true);
      case MessageDeliveryStatus.SENT:
        return assertVisibility(Channel.deliveryStatus('sent'), true);
      case MessageDeliveryStatus.DELIVERED:
        return assertVisibility(Channel.deliveryStatus('delivered'), true, 30000);
      case MessageDeliveryStatus.READ:
        return assertVisibility(Channel.deliveryStatus('read'), true, 30000);
      case MessageDeliveryStatus.NIL:
        for (const icon of ['sending', 'sent', 'delivered', 'read'] as const) {
          await assertVisibility(Channel.deliveryStatus(icon), false);
        }
        return;
      default:
        throw new Error(`Unsupported delivery status in preview: ${status}`);
    }
  });
};

UserRobot.prototype.assertFailedMessageDeliveryStatusInPreview = function () {
  return this.perform(() => assertVisibility(Channel.failedMessage, true));
};

UserRobot.prototype.assertMessagePreviewTimestamp = function (shown = true) {
  return this.perform(() => assertVisibility(Channel.timestamp, shown));
};

UserRobot.prototype.assertChannelListPagination = function (channelsCount) {
  // Generated channels are named "1" (newest) to "N" (oldest): the last one only shows once every
  // page is loaded.
  const last = Channel.nameWithText(`${channelsCount}`);
  return this.perform(async () => {
    for (let i = 0; i < 20 && !(await isDisplayed(last)); i++) {
      await (await waitToAppear(ChannelList.channelList)).swipe('up', 'slow', 0.6);
    }
    await waitToAppear(last);
  });
};

UserRobot.prototype.assertChannelWithName = function (name, shown = true) {
  return this.perform(() => assertVisibility(Channel.nameWithText(name), shown));
};

UserRobot.prototype.assertChannelIsMuted = function (muted) {
  return this.perform(() => assertVisibility(Channel.mutedIcon, muted));
};

UserRobot.prototype.assertChannelActionsSheetForGroupChannel = function () {
  return this.perform(async () => {
    for (const label of ['View Info', 'Leave Group', 'Delete Group']) {
      await waitToAppear(ChannelListPage.ChannelActions.item(label), { index: 0, timeout: 30000 });
    }
  });
};

UserRobot.prototype.assertGroupChannelInfoScreen = function () {
  return this.perform(() => waitToAppear(ChannelListPage.ChannelDetails.pinnedMessagesOption));
};

UserRobot.prototype.assertPinnedMessagesScreen = function () {
  return this.perform(() => waitToAppear(ChannelListPage.ChannelDetails.pinnedMessageList));
};

UserRobot.prototype.assertMessageInPinnedMessages = function (text) {
  return this.perform(() =>
    waitToAppear(ChannelListPage.ChannelDetails.pinnedMessage(text), { index: 0 }),
  );
};

UserRobot.prototype.assertPinnedMessagesAreEmpty = function () {
  return this.perform(async () => {
    jestExpect(await waitForCount(by.id(/^pinned-message-item-/), 0)).toBe(0);
  });
};

UserRobot.prototype.assertThreadListIsEmpty = function () {
  return this.perform(async () => {
    await waitToAppear(ChannelListPage.ThreadList.screen);
    jestExpect(await waitForCount(ChannelListPage.ThreadList.threads, 0)).toBe(0);
  });
};

UserRobot.prototype.assertThreadInThreadList = function (parentMessageText, replies) {
  const repliesLabel = replies === 1 ? '1 Reply' : `${replies} Replies`;
  return this.perform(async () => {
    const thread = ChannelListPage.ThreadList.threads;
    await waitToAppear(by.text(parentMessageText).withAncestor(thread), { index: 0 });
    await waitToAppear(by.text(repliesLabel).withAncestor(thread), { index: 0 });
  });
};

UserRobot.prototype.assertDraftInChannelPreview = function (text) {
  return this.perform(async () => {
    const preview = by.id('channel-preview-button');
    await waitToAppear(by.text('Draft:').withAncestor(preview), { index: 0 });
    await waitToAppear(by.text(text).withAncestor(preview), { index: 0 });
  });
};
