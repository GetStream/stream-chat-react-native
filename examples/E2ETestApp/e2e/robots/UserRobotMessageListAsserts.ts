import { expect as jestExpect } from '@jest/globals';

import { ParticipantRobot } from './ParticipantRobot';
import { editMessageNow, typeIntoComposer, UserRobot } from './UserRobot';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { MessageListPage } from '../pages/MessageListPage';
import {
  allAttributes,
  defaultTimeout,
  frameOf,
  indexFromBottom,
  isAnyDisplayed,
  isDisplayed,
  sleep,
  textOf,
  waitForCount,
  waitForExistence,
  waitForText,
  waitToAppear,
  waitToDisappear,
  waitUntil,
} from '../support/Element';

const { Composer, ContextMenu, MessageList } = MessageListPage;
const { Message } = MessageList;

declare module './UserRobot' {
  interface UserRobot {
    assertMessage(text: string, isDisplayed?: boolean): this;
    assertMessageAuthor(isCurrentUser: boolean): this;
    assertMessageDeliveryStatus(status: MessageDeliveryStatus, count?: number): this;
    assertMessageFailedIcon(isDisplayed: boolean): this;
    assertTypingIndicator(isDisplayed: boolean): this;
    assertScrollToBottomButton(isDisplayed: boolean): this;
    assertEditedMessage(text: string): this;
    /** `hard`: the message is gone, with no "Message deleted" placeholder. */
    assertDeletedMessage(text?: string, hard?: boolean): this;
    assertMessageTimestamps(count: number): this;
    assertMessageCount(count: number): this;
    assertMessageSizeChangesAfterEditing(linesCountShouldBeIncreased: boolean): this;
    /** `isChangeable`: the composer grows with 3 lines; otherwise it stops growing past 6. */
    assertComposerSize(isChangeable: boolean): this;
    assertComposerAttachmentsButton(isDisplayed?: boolean): this;
    assertComposerCommandsMenu(isDisplayed: boolean): this;
    assertComposerMentionsMenu(isDisplayed: boolean): this;
    assertMentionWasApplied(): this;
    assertComposerText(text: string): this;
    assertThreadIsOpen(): this;
    assertThreadMessage(text: string): this;
    assertThreadReplyLabelOnParentMessage(replies?: number): this;
    assertAlsoInTheChannelLabelInChannel(): this;
    assertAlsoInTheChannelLabelInThread(): this;
    /**
     * Scrolls up until the oldest of `messagesCount` seeded messages shows. The mock seeds message
     * texts with their 1-based index, so the oldest one reads "1".
     */
    assertMessageListPagination(messagesCount: number): this;
    /** Opens the message menu of the newest message and checks the action is not offered. */
    assertContextMenuActionNotAvailable(actionType: string, messageCellIndex?: number): this;
    /**
     * The quoted reply `text` with its `quote`; with `isDisplayed: false`, that the quote (and the
     * reply, when `text` is given) is not on screen.
     */
    assertQuotedMessage(options: { isDisplayed?: boolean; quote?: string; text?: string }): this;
    assertFile(isDisplayed: boolean, count?: number): this;
    assertGiphyImage(isDisplayed?: boolean): this;
    assertGiphyButtons(areDisplayed?: boolean): this;
    assertSystemMessage(text: string, isDisplayed?: boolean): this;
    assertInvalidCommandMessage(command: string, isDisplayed?: boolean): this;
    assertThreadReplyLabel(replies: number, inThread?: boolean): this;
    assertMessages(text: string, count: number): this;
    /** `0`: the scroll to bottom button shows no unread badge. */
    assertScrollToBottomButtonUnreadCount(count: number): this;
    assertReaction(type: string, isDisplayed: boolean): this;
    /** The user's name in the reactions overlay that opens on a tap on a reaction. */
    assertReactionAuthor(name: string): this;
    assertFlagMessageDialog(isDisplayed: boolean): this;
    /** Opens the message menu and checks it offers to unmute (`true`) or mute the author. */
    assertMuteMessageAuthorOption(messageText: string, isAuthorMuted: boolean): this;
    assertBlockMessageAuthorOption(messageText: string, isAuthorBlocked: boolean): this;
    assertCooldownIsShown(): this;
    assertCooldownIsNotShown(): this;
    /** The input and the attachments button are disabled, as Android's slow mode locks them. */
    assertComposerIsDisabledInSlowMode(): this;
    /** `pinnedBy`: the name in the label; the current user's label ("Pinned by You") by default. */
    assertMessagePinnedLabel(pinnedBy?: string, isDisplayed?: boolean): this;
    assertUnreadSeparator(unreadCount: number, isDisplayed?: boolean): this;
    assertLinkPreviewInComposer(isDisplayed: boolean): this;
    assertMediaAttachmentInPreview(isDisplayed: boolean, count?: number): this;
    assertImage(isDisplayed: boolean, count?: number): this;
    assertPollMessage(question: string, multipleVotes?: boolean): this;
    /** `isChecked`: also waits for the option's vote state, which a vote round-trip changes. */
    assertPollOption(option: string, isChecked?: boolean): this;
    /** How many options show `count` votes. */
    assertPollVoteCounts(count: number, options: number): this;
    assertPollResults(voterName: string): this;
    assertPollClosed(): this;
    assertVideo(isDisplayed: boolean): this;
    assertLinkPreviewInMessageList(isDisplayed: boolean): this;
    /** A message whose text contains `text` (a linkified text is split into several nodes). */
    assertMessageContaining(text: string): this;
    assertScrollToFirstUnreadButton(unreadCount?: number, isDisplayed?: boolean): this;
  }
}

/**
 * Waits until `selector` has been hidden for `stableMs` in a row. A single check can land before an
 * element briefly shows: on iOS 17 the scroll-to-bottom button flashes while the list catches up
 * with a message that just arrived, so "hidden" read once was a coin toss (nightly 43138494994).
 */
const waitUntilStaysHidden = async (
  selector: Detox.NativeMatcher,
  timeout: number,
  stableMs = 1000,
) => {
  const deadline = Date.now() + timeout;
  let hiddenSince: number | undefined;
  while (Date.now() < deadline) {
    if (await isDisplayed(selector, 0)) {
      hiddenSince = undefined;
    } else {
      hiddenSince ??= Date.now();
      if (Date.now() - hiddenSince >= stableMs) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

export const assertVisibility = async (
  selector: Detox.NativeMatcher,
  shouldBeDisplayed: boolean,
  timeout = defaultTimeout,
) => {
  if (shouldBeDisplayed) {
    // iOS: any match on screen, not just the first, which can be an off-screen list cell there.
    if (
      device.getPlatform() !== 'ios' ||
      !(await waitUntil(() => isAnyDisplayed(selector), timeout))
    ) {
      // Android, or the iOS wait failed: fails with Detox's own description of the selector.
      await waitToAppear(selector, {
        index: 0,
        timeout: device.getPlatform() === 'ios' ? 1000 : timeout,
      });
    }
  } else {
    await waitToDisappear(selector, { index: 0, timeout });
    await waitUntilStaysHidden(selector, timeout);
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
      // Any timestamp on screen: the first match can be one scrolled out of view. Waited for: when
      // messages arrive back to back, the group's footer moves to the newest one after its text.
      const shown = await waitUntil(async () =>
        (await allAttributes(Message.timestamp)).some((timestamp) => timestamp.visible),
      );
      jestExpect(shown).toBe(true);
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
        return assertFailedIcon(true, count);
      case MessageDeliveryStatus.NIL:
        // Only the list's message cells: a thread's parent message sits above the replies outside
        // any cell (ThreadFooterComponent) and shows its own status.
        for (const status of [
          Message.deliveryStatusIsRead,
          Message.deliveryStatusIsDelivered,
          Message.deliveryStatusIsPending,
          Message.deliveryStatusIsSent,
        ]) {
          await assertVisibility(status.withAncestor(MessageList.messages), false);
        }
        return;
      default:
        throw new Error(`Unsupported delivery status: ${status}`);
    }
  });
};

/**
 * The error badge sits in a container narrower than itself, which clips it below Detox's 75%
 * visibility threshold, so its presence is what is checked.
 */
const assertFailedIcon = async (shouldBeDisplayed: boolean, expected?: number) => {
  const exists = await waitForExistence(Message.deliveryStatusIsFailed, {
    index: 0,
    shouldExist: shouldBeDisplayed,
    timeout: 30000,
  });
  jestExpect(exists).toBe(shouldBeDisplayed);
  if (shouldBeDisplayed && expected !== undefined) {
    jestExpect(await waitForCount(Message.deliveryStatusIsFailed, expected)).toBe(expected);
  }
};

UserRobot.prototype.assertMessageFailedIcon = function (shouldBeDisplayed) {
  return this.perform(() => assertFailedIcon(shouldBeDisplayed));
};

UserRobot.prototype.assertTypingIndicator = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(MessageList.typingIndicator, shouldBeDisplayed));
};

UserRobot.prototype.assertScrollToBottomButton = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(MessageList.scrollToBottomButton, shouldBeDisplayed));
};

UserRobot.prototype.assertEditedMessage = function (text) {
  return this.assertMessage(text).perform(() => waitToAppear(Message.editedLabel));
};

UserRobot.prototype.assertDeletedMessage = function (text, hard = false) {
  this.perform(async () => {
    if (hard) {
      await assertVisibility(Message.deletedMessage, false);
    } else {
      // An existence check: Fabric mounts the testID'd container without its content on iOS, so
      // Detox iOS (pixel-based visibility) never reports it visible.
      jestExpect(await waitForExistence(Message.deletedMessage, { index: 0 })).toBe(true);
      jestExpect(await isDisplayed(Message.timestamp, 0)).toBe(true);
    }
  });
  return text === undefined ? this : this.assertMessage(text, false);
};

UserRobot.prototype.assertMessageTimestamps = function (expected) {
  return this.perform(async () => {
    jestExpect(await waitForCount(Message.timestamp, expected)).toBe(expected);
  });
};

UserRobot.prototype.assertMessageCount = function (expected) {
  return this.perform(async () => {
    jestExpect(await waitForCount(MessageList.messageContents, expected)).toBe(expected);
  });
};

const newestMessageHeight = async () => {
  const index = await indexFromBottom(MessageList.messageContents, 0);
  return (await frameOf(MessageList.messageContents, index)).height;
};

UserRobot.prototype.assertMessageSizeChangesAfterEditing = function (increased) {
  let initialHeight = 0;
  let newText = '';
  return this.perform(async () => {
    initialHeight = await newestMessageHeight();
    // Android rolls the bubble's text up into the container; iOS gives the container no label, so
    // the text comes from the newest bubble's paragraph there.
    const source =
      device.getPlatform() === 'ios'
        ? by.type('RCTParagraphComponentView').withAncestor(by.id('message-content-wrapper'))
        : MessageList.messageContents;
    const index = await indexFromBottom(source, 0);
    const messageText = await textOf(source, index);
    newText = increased ? `ok\n${messageText}\nnew line` : 'new line';
  })
    .perform(async () => {
      await editMessageNow(newText);
      await waitToAppear(Message.text(newText));
    })
    .perform(async () => {
      const changed = await waitUntil(async () => {
        const height = await newestMessageHeight();
        return increased ? height > initialHeight : height < initialHeight;
      });
      jestExpect(changed).toBe(true);
    });
};

UserRobot.prototype.assertComposerSize = function (isChangeable) {
  return this.perform(async () => {
    const initialHeight = (await frameOf(Composer.inputField)).height;
    if (isChangeable) {
      await typeIntoComposer('1\n2\n3');
      await sleep(500);
      jestExpect((await frameOf(Composer.inputField)).height).not.toBe(initialHeight);
    } else {
      const text = '1\n2\n3\n4\n5\n6';
      await typeIntoComposer(text, true);
      await sleep(500);
      const grownHeight = (await frameOf(Composer.inputField)).height;
      await typeIntoComposer(`${text}\n7`, true);
      await sleep(500);
      jestExpect((await frameOf(Composer.inputField)).height).toBe(grownHeight);
    }
  });
};

UserRobot.prototype.assertComposerAttachmentsButton = function (shouldBeDisplayed = true) {
  return this.perform(() => assertVisibility(Composer.attachmentsButton, shouldBeDisplayed));
};

UserRobot.prototype.assertComposerCommandsMenu = function (shouldBeDisplayed) {
  return this.perform(async () => {
    await assertVisibility(Composer.commandSuggestion, shouldBeDisplayed);
    if (shouldBeDisplayed) {
      jestExpect(await isDisplayed(Composer.commandsHeader)).toBe(true);
    }
  });
};

UserRobot.prototype.assertComposerMentionsMenu = function (shouldBeDisplayed) {
  return this.perform(() => assertVisibility(Composer.userSuggestion, shouldBeDisplayed));
};

UserRobot.prototype.assertMentionWasApplied = function () {
  return this.assertComposerText(`@${ParticipantRobot.userName} `);
};

UserRobot.prototype.assertComposerText = function (text) {
  return this.perform(async () => {
    jestExpect(await waitForText(Composer.inputField, text)).toBe(text);
  });
};

UserRobot.prototype.assertThreadIsOpen = function () {
  return this.perform(() => waitToAppear(Composer.alsoSendToChannelCheckbox));
};

UserRobot.prototype.assertThreadMessage = function (text) {
  return this.assertThreadIsOpen().assertMessage(text);
};

UserRobot.prototype.assertThreadReplyLabelOnParentMessage = function (replies = 1) {
  const expected = replies === 1 ? '1 Reply' : `${replies} Replies`;
  return this.perform(async () => {
    jestExpect(await waitForText(Message.threadRepliesLabel, expected)).toBe(expected);
  });
};

UserRobot.prototype.assertAlsoInTheChannelLabelInChannel = function () {
  return this.perform(() => waitToAppear(Message.repliedToThreadLabel, { index: 0 }));
};

UserRobot.prototype.assertAlsoInTheChannelLabelInThread = function () {
  return this.perform(() => waitToAppear(Message.alsoSentInChannelLabel, { index: 0 }));
};

UserRobot.prototype.assertMessageListPagination = function (messagesCount) {
  const oldest = Message.text('1');
  return this.perform(async () => {
    // Waited for: right after a thread opens its replies are still loading.
    await waitToAppear(Message.text(`${messagesCount}`), { index: 0 });
    for (let i = 0; i < 30 && !(await isAnyDisplayed(oldest)); i++) {
      await (await waitToAppear(MessageList.scrollTarget, { index: 0 })).swipe('down', 'fast', 0.8);
    }
    await waitToAppear(oldest, { index: 0 });
  });
};

UserRobot.prototype.assertContextMenuActionNotAvailable = function (
  actionType,
  messageCellIndex = 0,
) {
  return this.openContextMenu(messageCellIndex)
    .perform(async () => {
      // Another action proves the menu is open before the absence is checked: every message menu
      // offers copy or, for a failed message, resend.
      const opened = await waitUntil(
        async () =>
          (await isDisplayed(ContextMenu.action('copyMessage'), 0)) ||
          (await isDisplayed(ContextMenu.action('retry'), 0)),
      );
      jestExpect(opened).toBe(true);
      jestExpect(await isDisplayed(ContextMenu.action(actionType))).toBe(false);
    })
    .closeContextMenu();
};

/**
 * Whether a quote reading `quote` is on screen. The quote is one accessible element (it has its own
 * label), so Detox doesn't match its texts as descendants: a text inside its frame counts instead.
 */
export const isQuoteDisplayed = async (quote?: string) => {
  // Detox iOS also reports the list's off-screen cells (Android's UiAutomator doesn't), so only the
  // quotes on screen count.
  const quotes = (await allAttributes(Message.quotedMessage))
    .filter((attributes) => attributes.visible !== false)
    .map((attributes) => attributes.frame);
  if (quote === undefined) {
    return quotes.length > 0;
  }
  const texts = await allAttributes(by.text(quote));
  return texts.some(({ frame }) =>
    quotes.some(
      (box) =>
        !!frame &&
        !!box &&
        frame.x >= box.x &&
        frame.y >= box.y &&
        frame.x + frame.width <= box.x + box.width + 1 &&
        frame.y + frame.height <= box.y + box.height + 1,
    ),
  );
};

UserRobot.prototype.assertQuotedMessage = function ({ isDisplayed: shown = true, quote, text }) {
  return this.perform(async () => {
    const reached = await waitUntil(async () => (await isQuoteDisplayed(quote)) === shown);
    jestExpect(reached).toBe(true);
    if (text !== undefined) {
      await assertVisibility(Message.text(text), shown);
    }
  });
};

UserRobot.prototype.assertFile = function (shown, expected = 1) {
  return this.perform(async () => {
    await assertVisibility(Message.file, shown);
    if (shown) {
      jestExpect(await waitForCount(Message.file, expected)).toBe(expected);
    }
  });
};

UserRobot.prototype.assertGiphyImage = function (shown = true) {
  return this.perform(() => assertVisibility(Message.giphy, shown));
};

UserRobot.prototype.assertGiphyButtons = function (shown = true) {
  return this.perform(async () => {
    await assertVisibility(Message.GiphyButtons.send, shown);
    await assertVisibility(Message.GiphyButtons.shuffle, shown);
    await assertVisibility(Message.GiphyButtons.cancel, shown);
  });
};

UserRobot.prototype.assertSystemMessage = function (text, shown = true) {
  return this.perform(() => assertVisibility(inList(by.text(text)), shown));
};

UserRobot.prototype.assertInvalidCommandMessage = function (command, shown = true) {
  return this.assertSystemMessage(
    `Sorry, command ${command} doesn't exist. Try posting your message without the starting /`,
    shown,
  );
};

UserRobot.prototype.assertThreadReplyLabel = function (replies, inThread = false) {
  const expected = replies === 1 ? '1 Reply' : `${replies} Replies`;
  return this.perform(async () => {
    if (inThread) {
      // The label sits in a labelled container, which hides it from descendant matching. The
      // container itself is checked for existence: Fabric mounts it without its content on iOS, so
      // Detox iOS never reports it visible. The label's own visibility is asserted below.
      jestExpect(await waitForExistence(MessageListPage.ThreadPage.repliesCountLabel)).toBe(true);
      await waitToAppear(inList(by.text(expected)), { index: 0 });
      return;
    }
    jestExpect(await waitForText(Message.threadRepliesLabel, expected)).toBe(expected);
  });
};

UserRobot.prototype.assertMessages = function (text, expected) {
  return this.perform(async () => {
    if (device.getPlatform() !== 'ios') {
      jestExpect(await waitForCount(Message.text(text), expected)).toBe(expected);
      return;
    }
    // Only the ones on screen: iOS 17 still reports the hidden channel under an open thread.
    let actual = 0;
    await waitUntil(async () => {
      actual = (await allAttributes(Message.text(text))).filter((match) => match.visible).length;
      return actual === expected;
    });
    jestExpect(actual).toBe(expected);
  });
};

const inList = (matcher: Detox.NativeMatcher) =>
  matcher.withAncestor(by.id(/^message-(flat|flash)-list$/));

UserRobot.prototype.assertScrollToBottomButtonUnreadCount = function (expected) {
  const badge = by.id('unread-count').withAncestor(by.id('scroll-to-bottom-button-unread-count'));
  return this.perform(async () => {
    if (expected > 0) {
      jestExpect(await waitForText(badge, `${expected}`)).toBe(`${expected}`);
    } else {
      await assertVisibility(badge, false);
    }
  });
};

UserRobot.prototype.assertReaction = function (type, shown) {
  return this.perform(() => assertVisibility(Message.Reactions.reaction(type), shown));
};

UserRobot.prototype.assertReactionAuthor = function (name) {
  // Scoped to the reactions sheet: the author's name also shows under the message behind it.
  return this.perform(() =>
    waitToAppear(by.text(name).withAncestor(by.label('reaction-flat-list')), { index: 0 }),
  );
};

UserRobot.prototype.assertFlagMessageDialog = function (shown) {
  return this.perform(() =>
    assertVisibility(
      by.text(
        'Do you want to send a copy of this message to a moderator for further investigation?',
      ),
      shown,
    ),
  );
};

/** Opens the message menu on `messageText` and waits for the action titled `expected`. */
const assertMenuActionTitle = function (
  robot: UserRobot,
  messageText: string,
  actionType: string,
  expected: string,
  unexpected: string,
) {
  return robot
    .openContextMenuOnMessage(messageText)
    .perform(async () => {
      const title = by.text(expected).withAncestor(ContextMenu.action(actionType));
      // The open menu rebuilds its actions when the own user's state lands.
      await waitToAppear(title, { index: 0, timeout: 15000 });
      jestExpect(
        await isDisplayed(by.text(unexpected).withAncestor(ContextMenu.action(actionType))),
      ).toBe(false);
    })
    .closeContextMenu();
};

UserRobot.prototype.assertMuteMessageAuthorOption = function (messageText, muted) {
  return assertMenuActionTitle(
    this,
    messageText,
    'muteUser',
    muted ? 'Unmute User' : 'Mute User',
    muted ? 'Mute User' : 'Unmute User',
  );
};

UserRobot.prototype.assertBlockMessageAuthorOption = function (messageText, blocked) {
  return assertMenuActionTitle(
    this,
    messageText,
    'blockUser',
    blocked ? 'Unblock User' : 'Block User',
    blocked ? 'Block User' : 'Unblock User',
  );
};

UserRobot.prototype.assertCooldownIsShown = function () {
  return this.perform(async () => {
    await waitToAppear(Composer.cooldownIndicator);
    jestExpect(await isDisplayed(Composer.sendButton)).toBe(false);
  });
};

UserRobot.prototype.assertCooldownIsNotShown = function () {
  return this.perform(() => assertVisibility(Composer.cooldownIndicator, false));
};

UserRobot.prototype.assertComposerIsDisabledInSlowMode = function () {
  return this.perform(async () => {
    await waitToAppear(Composer.inputField);
    jestExpect((await allAttributes(Composer.inputField))[0]?.enabled).toBe(false);
    jestExpect((await allAttributes(Composer.attachmentsButton))[0]?.enabled).toBe(false);
  });
};

UserRobot.prototype.assertMessagePinnedLabel = function (pinnedBy = 'You', shown = true) {
  return this.perform(() => assertVisibility(Message.pinnedLabel(pinnedBy), shown));
};

UserRobot.prototype.assertUnreadSeparator = function (unreadCount, shown = true) {
  // Android's `stream_compose_message_list_unread_separator`.
  const expected = unreadCount === 1 ? '1 unread message' : `${unreadCount} unread messages`;
  return this.perform(async () => {
    if (shown) {
      // The separator is one labelled element, so its text isn't matched as its descendant.
      await waitToAppear(MessageList.unreadSeparator, { index: 0 });
      await waitToAppear(inList(by.text(expected)), { index: 0 });
    } else {
      await assertVisibility(MessageList.unreadSeparator, false);
    }
  });
};

UserRobot.prototype.assertScrollToFirstUnreadButton = function (unreadCount, shown = true) {
  return this.perform(async () => {
    await assertVisibility(MessageList.scrollToFirstUnreadButton, shown);
    if (shown && unreadCount !== undefined) {
      const label = by
        .text(`${unreadCount} unread`)
        .withAncestor(MessageList.scrollToFirstUnreadButton);
      await waitToAppear(label, { index: 0 });
    }
  });
};

UserRobot.prototype.assertLinkPreviewInComposer = function (shown) {
  return this.perform(() => assertVisibility(Composer.linkPreview, shown));
};

UserRobot.prototype.assertLinkPreviewInMessageList = function (shown) {
  return this.perform(() =>
    assertVisibility(Message.linkPreview, shown, shown ? 30000 : defaultTimeout),
  );
};

UserRobot.prototype.assertMessageContaining = function (text) {
  return this.perform(async () => {
    const contents = MessageList.messageContents;
    // Android rolls the bubble's texts up into the container's description; iOS gives the
    // container no label, but Fabric flattens the text and its link spans into one paragraph.
    const paragraphs = Message.text(text);
    const found = await waitUntil(async () =>
      device.getPlatform() === 'ios'
        ? (await allAttributes(paragraphs)).length > 0
        : (await allAttributes(contents)).some((content) =>
            (content.label ?? content.text ?? '').includes(text),
          ),
    );
    jestExpect(found).toBe(true);
  });
};

UserRobot.prototype.assertMediaAttachmentInPreview = function (shown, expected = 1) {
  return this.perform(async () => {
    if (!shown) {
      return assertVisibility(Composer.mediaAttachmentPreview, false);
    }
    // Fabric mounts the preview container without its content on iOS, so Detox iOS never reports
    // it visible.
    jestExpect(await waitForExistence(Composer.mediaAttachmentPreview, { index: 0 })).toBe(true);
    jestExpect(await waitForCount(Composer.mediaAttachmentPreview, expected)).toBe(expected);
  });
};

UserRobot.prototype.assertImage = function (shown, expected = 1) {
  return this.perform(async () => {
    if (!shown) {
      return assertVisibility(Message.galleryItem, false);
    }
    await waitForExistence(Message.galleryItem, { index: 0, timeout: 30000 });
    jestExpect(await waitForCount(Message.galleryItem, expected)).toBe(expected);
  });
};

UserRobot.prototype.assertVideo = function (shown) {
  return this.perform(async () => {
    if (!shown) {
      return assertVisibility(Message.gallery, false);
    }
    // Like `assertImage`: Fabric mounts the gallery container without its content on iOS, so
    // Detox iOS never reports it visible.
    jestExpect(await waitForExistence(Message.gallery, { index: 0, timeout: 30000 })).toBe(true);
  });
};

UserRobot.prototype.assertPollMessage = function (question, multipleVotes = false) {
  return this.perform(async () => {
    await waitToAppear(Message.Poll.question(question), { index: 0 });
    await waitToAppear(
      multipleVotes ? inList(by.text('Select one or more')) : Message.Poll.singleVoteSubtitle,
      { index: 0 },
    );
  });
};

UserRobot.prototype.assertPollOption = function (option, isChecked) {
  return this.perform(async () => {
    await waitToAppear(Message.Poll.option(option), { index: 0 });
    if (isChecked !== undefined) {
      await waitForExistence(Message.Poll.voteButton(option, isChecked), { index: 0 });
      jestExpect(
        await waitForExistence(Message.Poll.voteButton(option, isChecked), { index: 0 }),
      ).toBe(true);
    }
  });
};

UserRobot.prototype.assertPollVoteCounts = function (votes, options) {
  return this.perform(async () => {
    jestExpect(await waitForCount(Message.Poll.voteCount(votes), options)).toBe(options);
  });
};

UserRobot.prototype.assertPollResults = function (voterName) {
  return this.perform(async () => {
    await waitToAppear(Message.Poll.resultsTitle, { index: 0 });
    await waitToAppear(by.text(voterName), { index: 0 });
  });
};

UserRobot.prototype.assertPollClosed = function () {
  return this.perform(async () => {
    await waitToAppear(Message.Poll.closedSubtitle, { index: 0 });
    await assertVisibility(Message.Poll.endPollButton, false);
  });
};
