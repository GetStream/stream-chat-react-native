import { expect as jestExpect } from '@jest/globals';

import { UserRobot } from './UserRobot';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { MessageListPage } from '../pages/MessageListPage';
import {
  defaultTimeout,
  isDisplayed,
  waitForCount,
  waitForExistence,
  waitToAppear,
  waitToDisappear,
} from '../support/Element';

const { MessageList } = MessageListPage;
const { Message } = MessageList;

declare module './UserRobot' {
  interface UserRobot {
    assertMessage(text: string, isDisplayed?: boolean): this;
    assertMessageAuthor(isCurrentUser: boolean): this;
    assertMessageDeliveryStatus(status: MessageDeliveryStatus, count?: number): this;
    assertMessageFailedIcon(isDisplayed: boolean): this;
    assertTypingIndicator(isDisplayed: boolean): this;
    assertScrollToBottomButton(isDisplayed: boolean): this;
  }
}

export const assertVisibility = async (
  selector: Detox.NativeMatcher,
  shouldBeDisplayed: boolean,
  timeout = defaultTimeout,
) => {
  if (shouldBeDisplayed) {
    await waitToAppear(selector, { index: 0, timeout });
  } else {
    await waitToDisappear(selector, { index: 0, timeout });
    jestExpect(await isDisplayed(selector, 0)).toBe(false);
  }
};

const assertDeliveryStatusCount = async (selector: Detox.NativeMatcher, count?: number) => {
  await assertVisibility(selector, true, 30000);
  if (count !== undefined) {
    jestExpect(await waitForCount(selector, count)).toBe(count);
  }
};

UserRobot.prototype.assertMessage = function (text, shouldBeDisplayed = true) {
  return this.perform(async () => {
    await assertVisibility(Message.text(text), shouldBeDisplayed);
    if (shouldBeDisplayed) {
      jestExpect(await isDisplayed(Message.timestamp, 0)).toBe(true);
    }
  });
};

/** The current user's messages carry no avatar; other users' do. */
UserRobot.prototype.assertMessageAuthor = function (isCurrentUser) {
  return this.perform(async () => {
    const exists = await waitForExistence(Message.avatar, {
      index: 0,
      shouldExist: !isCurrentUser,
    });
    jestExpect(exists).toBe(!isCurrentUser);
  });
};

UserRobot.prototype.assertMessageDeliveryStatus = function (status, count) {
  return this.perform(async () => {
    switch (status) {
      case MessageDeliveryStatus.READ:
        return assertDeliveryStatusCount(Message.deliveryStatusIsRead, count);
      case MessageDeliveryStatus.DELIVERED:
        return assertDeliveryStatusCount(Message.deliveryStatusIsDelivered, count);
      case MessageDeliveryStatus.PENDING:
        return assertDeliveryStatusCount(Message.deliveryStatusIsPending, count);
      case MessageDeliveryStatus.SENT:
        return assertDeliveryStatusCount(Message.deliveryStatusIsSent, count);
      case MessageDeliveryStatus.FAILED:
        return assertDeliveryStatusCount(Message.deliveryStatusIsFailed, count);
      case MessageDeliveryStatus.NIL:
        await assertVisibility(Message.deliveryStatusIsRead, false);
        await assertVisibility(Message.deliveryStatusIsDelivered, false);
        await assertVisibility(Message.deliveryStatusIsPending, false);
        await assertVisibility(Message.deliveryStatusIsSent, false);
        return;
      default:
        throw new Error(`Unsupported delivery status: ${status}`);
    }
  });
};

UserRobot.prototype.assertMessageFailedIcon = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(Message.deliveryStatusIsFailed, shouldBeDisplayed));
};

UserRobot.prototype.assertTypingIndicator = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(MessageList.typingIndicator, shouldBeDisplayed));
};

UserRobot.prototype.assertScrollToBottomButton = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(MessageList.scrollToBottomButton, shouldBeDisplayed));
};
