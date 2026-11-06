import { ParticipantRobot } from './ParticipantRobot';

import { Robot } from './Robot';

import { ReactionType } from '../mock-server/DataTypes';
import { ChannelListPage } from '../pages/ChannelListPage';
import { LoginPage } from '../pages/LoginPage';
import { MessageListPage } from '../pages/MessageListPage';
import { adb } from '../support/AndroidSystemDialogs';
import {
  allAttributes,
  frameOf,
  indexFromBottom,
  isDisplayed,
  sleep,
  waitToAppear,
  waitToAppearAndClick,
  waitToAppearAndLongPress,
  waitToDisappear,
  waitUntil,
} from '../support/Element';

const { ChannelList } = ChannelListPage;
const { Alert, Composer, ContextMenu, Header, MessageList } = MessageListPage;

const extendedPickerEmoji: Record<ReactionType, string> = {
  [ReactionType.LIKE]: '👍',
  [ReactionType.LOL]: '😂',
  [ReactionType.LOVE]: '❤️',
  [ReactionType.SAD]: '😢',
  [ReactionType.WOW]: '😮',
};

/** Drives the app as the logged-in user. Asserts live in the `UserRobot*Asserts` extensions. */
export class UserRobot extends Robot {
  login(): this {
    return this.perform(() => waitToAppearAndClick(LoginPage.loginButton));
  }

  waitForChannelListToLoad(): this {
    return this.perform(() => waitToAppear(ChannelList.channels, { index: 0 }));
  }

  waitForMessageListToLoad(): this {
    return this.perform(() => waitToAppear(Composer.inputField));
  }

  openChannel(channelCellIndex = 0): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelList.channels, { index: channelCellIndex }),
    ).waitForMessageListToLoad();
  }

  openChannelWithName(channelName: string): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelList.Channel.nameWithText(channelName)),
    ).waitForMessageListToLoad();
  }

  /** Long-presses the `messageCellIndex`-th message counted from the newest (0). */
  openContextMenu(messageCellIndex = 0): this {
    return this.perform(async () => {
      const index = await indexFromBottom(MessageList.messageContents, messageCellIndex);
      await waitToAppearAndLongPress(MessageList.messageContents, { index });
    });
  }

  /**
   * Long-presses the newest message reading `messageText`. A quoted reply repeats the original's
   * text inside its bubble, so texts lying inside a quote don't count.
   */
  openContextMenuOnMessage(messageText: string): this {
    return this.perform(async () => {
      const selector = MessageList.Message.text(messageText);
      const quotes = (await allAttributes(MessageList.Message.quotedMessage)).map((q) => q.frame);
      const inQuote = (frame?: { height: number; width: number; x: number; y: number }) =>
        !!frame &&
        quotes.some(
          (box) =>
            !!box &&
            frame.x >= box.x &&
            frame.y >= box.y &&
            frame.y + frame.height <= box.y + box.height + 1,
        );
      await waitToAppear(selector, { index: 0 });
      const candidates = (await allAttributes(selector))
        .map((attributes, index) => ({ frame: attributes.frame, index }))
        .filter(({ frame }) => !inQuote(frame))
        .sort((a, b) => (b.frame?.y ?? 0) - (a.frame?.y ?? 0));
      await waitToAppearAndLongPress(selector, { index: candidates[0]?.index ?? 0 });
    });
  }

  tapOnContextMenuAction(actionType: string): this {
    return this.perform(() => waitToAppearAndClick(ContextMenu.action(actionType), { index: 0 }));
  }

  closeContextMenu(): this {
    return this.perform(async () => {
      if (device.getPlatform() === 'android') {
        await device.pressBack();
      } else {
        await waitToAppearAndClick(ContextMenu.backdrop);
      }
      await waitToDisappear(ContextMenu.backdrop);
    });
  }

  /** Swipes the `messageCellIndex`-th message from the newest to the right, which quotes it. */
  swipeMessage(messageCellIndex = 0): this {
    return this.perform(async () => {
      const index = await indexFromBottom(MessageList.messageContents, messageCellIndex);
      const message = await waitToAppear(MessageList.messageContents, { index });
      await message.swipe('right', 'slow', 0.5);
    });
  }

  selectReplyFromContextMenu(messageCellIndex = 0): this {
    return this.openContextMenu(messageCellIndex).tapOnContextMenuAction('quotedReply');
  }

  quoteMessage(text: string, messageCellIndex = 0): this {
    return this.selectReplyFromContextMenu(messageCellIndex).sendMessage(text);
  }

  quoteMessageWithText(text: string, quotedMessageText: string): this {
    return this.openContextMenuOnMessage(quotedMessageText)
      .tapOnContextMenuAction('quotedReply')
      .sendMessage(text);
  }

  deleteMessageWithText(text: string): this {
    return this.openContextMenuOnMessage(text)
      .tapOnContextMenuAction('deleteMessage')
      .tapOnAlertButton('Delete');
  }

  /**
   * Taps the newest quote, which jumps to the quoted message. A tap that lands while the list is
   * still moving can be lost, so it taps again while the quote stays on screen.
   */
  tapOnQuotedMessage(): this {
    return this.perform(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const index = await indexFromBottom(MessageList.Message.quotedMessage, 0);
        await waitToAppearAndClick(MessageList.Message.quotedMessage, { index });
        await waitToDisappear(MessageList.Message.quotedMessage, { timeout: 3000 });
        if (!(await isDisplayed(MessageList.Message.quotedMessage))) {
          return;
        }
      }
    });
  }

  /** Taps "View" in the "Replied to a thread" header of the newest such message. */
  tapOnSentToChannelHeaderLink(): this {
    return this.perform(async () => {
      const link = by.id('sent-to-channel-header-view-button');
      await waitToAppearAndClick(link, { index: await indexFromBottom(link, 0) });
    }).perform(() => waitToAppear(Composer.alsoSendToChannelCheckbox));
  }

  /**
   * Runs `/giphy` from the composer, by typing it or through the command suggestions, and sends the
   * picked gif unless `send` is off (the ephemeral preview stays then).
   */
  uploadGiphy({
    send = true,
    useComposerCommand = false,
  }: { send?: boolean; useComposerCommand?: boolean } = {}): this {
    if (useComposerCommand) {
      // Typed as a key press: on Android `replaceText` would also drop the command the suggestion
      // picked, and send a plain "G".
      this.openComposerCommands()
        .tapOnGiphyCommandSuggestion()
        .perform(async () => (await waitToAppear(Composer.inputField)).typeText('G'))
        .tapOnSendButton();
    } else {
      this.sendMessage('/giphy G');
    }
    return send ? this.tapOnSendGiphyButton() : this;
  }

  tapOnSendGiphyButton(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.Message.GiphyButtons.send));
  }

  tapOnShuffleGiphyButton(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.Message.GiphyButtons.shuffle));
  }

  tapOnCancelGiphyButton(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.Message.GiphyButtons.cancel));
  }

  flagMessage(text: string): this {
    return this.openContextMenuOnMessage(text).tapOnContextMenuAction('flagMessage');
  }

  confirmFlagMessage(): this {
    return this.tapOnAlertButton('Flag');
  }

  /** Mute and unmute are the same menu action; its title says which one it does. */
  muteMessageAuthor(text: string): this {
    return this.openContextMenuOnMessage(text).tapOnContextMenuAction('muteUser');
  }

  unmuteMessageAuthor(text: string): this {
    return this.muteMessageAuthor(text);
  }

  blockMessageAuthor(text: string): this {
    return this.openContextMenuOnMessage(text)
      .tapOnContextMenuAction('blockUser')
      .tapOnAlertButton('Block');
  }

  /** Unblocking asks for no confirmation. */
  unblockMessageAuthor(text: string): this {
    return this.openContextMenuOnMessage(text).tapOnContextMenuAction('blockUser');
  }

  copyMessage(messageCellIndex = 0): this {
    return this.openContextMenu(messageCellIndex).tapOnContextMenuAction('copyMessage');
  }

  /** Pastes the clipboard into the composer: the test runner can't read the device clipboard. */
  pasteIntoComposer(): this {
    return this.perform(async () => {
      if (device.getPlatform() === 'android') {
        // Android shows a clipboard preview chip over the bottom of the screen after a copy; a tap
        // on the composer while it is up lands on it (and opens Quick Share).
        await sleep(6000);
      }
      const inputField = await waitToAppearAndClick(Composer.inputField);
      if (device.getPlatform() === 'android') {
        adb('shell', 'input', 'keyevent', 'KEYCODE_PASTE');
      } else {
        await inputField.longPress();
        await waitToAppearAndClick(by.label('Paste'), { index: 0 });
      }
    });
  }

  tapOnLinkPreviewCancelButton(): this {
    return this.perform(() => waitToAppearAndClick(Composer.linkPreviewCancelButton));
  }

  openAttachmentsMenu(): this {
    return this.perform(() => waitToAppearAndClick(Composer.attachmentsButton));
  }

  /** Picks `count` images from the attachment picker's gallery (see `seedImages`). */
  attachImages(count = 1): this {
    return this.openAttachmentsMenu().perform(async () => {
      // A picked image is relabelled "Deselect image", so the next one is always the first match.
      for (let i = 0; i < count; i++) {
        await waitToAppearAndClick(MessageListPage.AttachmentPicker.images, { index: 0 });
      }
    });
  }

  createPoll(question: string, options: string[], { multipleVotes = false } = {}): this {
    const { CreatePoll } = MessageListPage;
    return this.openAttachmentsMenu()
      .perform(() => waitToAppearAndClick(by.id('create-poll-touchable')))
      .perform(async () => {
        await (await waitToAppearAndClick(CreatePoll.fields, { index: 0 })).replaceText(question);
        for (const [index, option] of options.entries()) {
          await (
            await waitToAppearAndClick(CreatePoll.fields, { index: index + 1 })
          ).replaceText(option);
        }
        if (multipleVotes) {
          // The keyboard covers the switches below the options.
          if (device.getPlatform() === 'android') {
            // A tap outside the fields hides the keyboard (the sheet's ScrollView doesn't persist
            // taps). Back would close the sheet when a CI emulator has shown no keyboard.
            await element(CreatePoll.questionLabel).tap();
          } else {
            await element(CreatePoll.fields).atIndex(0).tapReturnKey();
          }
          await waitToAppearAndClick(CreatePoll.multipleVotesSwitch, { index: 0 });
        }
        await waitToAppearAndClick(CreatePoll.createButton);
      });
  }

  castPollVote(option: string): this {
    return this.perform(() =>
      waitToAppearAndClick(MessageList.Message.Poll.voteButton(option), { index: 0 }),
    );
  }

  /** A tap on an option the user already voted for removes the vote. */
  removePollVote(option: string): this {
    return this.castPollVote(option);
  }

  openPollResults(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.Message.Poll.viewResultsButton));
  }

  endPoll(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.Message.Poll.endPollButton)).perform(
      async () => {
        // Confirmation, where the SDK asks for one.
        const confirm = MessageListPage.Alert.button('End');
        if (await isDisplayed(confirm)) {
          await waitToAppearAndClick(confirm);
        }
      },
    );
  }

  pinMessage(messageCellIndex = 0): this {
    return this.openContextMenu(messageCellIndex).tapOnContextMenuAction('pinMessage');
  }

  unpinMessage(messageCellIndex = 0): this {
    return this.openContextMenu(messageCellIndex).tapOnContextMenuAction('unpinMessage');
  }

  markMessageAsUnread(text: string): this {
    return this.openContextMenuOnMessage(text).tapOnContextMenuAction('markUnread');
  }

  tapOnScrollToFirstUnreadButton(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.scrollToFirstUnreadButton));
  }

  dismissUnreadIndicator(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.scrollToFirstUnreadDismissButton));
  }

  openThreadList(): this {
    return this.perform(() => waitToAppearAndClick(ChannelListPage.Tabs.threads));
  }

  openChannelListTab(): this {
    return this.perform(() => waitToAppearAndClick(ChannelListPage.Tabs.channels));
  }

  openThreadFromThreadList(index = 0): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelListPage.ThreadList.threads, { index }),
    ).perform(() => waitToAppear(Composer.alsoSendToChannelCheckbox));
  }

  swipeChannel(channelCellIndex = 0): this {
    return this.perform(async () => {
      const channel = await waitToAppear(ChannelList.channels, { index: channelCellIndex });
      await channel.swipe('left', 'slow', 0.5);
    });
  }

  tapOnMoreSwipeAction(): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelList.Channel.swipeAction('openSheet'), { index: 0 }),
    );
  }

  tapOnMuteSwipeAction(): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelList.Channel.swipeAction('mute'), { index: 0 }),
    );
  }

  tapOnUnmuteSwipeAction(): this {
    return this.tapOnMuteSwipeAction();
  }

  /**
   * Opens the channel actions sheet from the "more" swipe action. The native robots long press the
   * channel, which RN doesn't support yet (https://linear.app/stream/issue/RN-499): see
   * `longPressChannel`.
   */
  openChannelMenu(channelCellIndex = 0): this {
    return this.swipeChannel(channelCellIndex).tapOnMoreSwipeAction();
  }

  /** The native `openChannelMenu`: a long press on the channel. */
  longPressChannel(channelCellIndex = 0): this {
    return this.perform(() =>
      waitToAppearAndLongPress(ChannelList.channels, { index: channelCellIndex }),
    );
  }

  /**
   * The sheet sometimes opens with no content at all and stays empty
   * (https://linear.app/stream/issue/RN-489): such a run fails here.
   */
  tapOnChannelAction(label: string): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelListPage.ChannelActions.item(label), {
        index: 0,
        timeout: 30000,
      }),
    );
  }

  tapOnLeaveGroup(): this {
    return this.tapOnChannelAction('Leave Group');
  }

  tapOnDeleteGroup(): this {
    return this.tapOnChannelAction('Delete Group');
  }

  confirmChannelAction(action: 'Leave' | 'Delete'): this {
    return this.tapOnAlertButton(action);
  }

  tapOnViewChannelInfo(): this {
    return this.tapOnChannelAction('View Info');
  }

  tapOnPinnedMessagesOption(): this {
    return this.perform(() =>
      waitToAppearAndClick(ChannelListPage.ChannelDetails.pinnedMessagesOption),
    );
  }

  addReaction(type: string, messageCellIndex = 0): this {
    return this.openContextMenu(messageCellIndex).perform(() =>
      waitToAppearAndClick(ContextMenu.reaction(type), { index: 0 }),
    );
  }

  /** Removes the user's reaction: picking the same type in the menu toggles it off. */
  deleteReaction(type: string, messageCellIndex = 0): this {
    return this.addReaction(type, messageCellIndex);
  }

  /**
   * Picks the reaction `type` in the extended reactions picker; picking one already used removes
   * it, as in the native robots.
   */
  toggleReactionUsingExtendedPicker(type: ReactionType, messageCellIndex = 0): this {
    const emoji = extendedPickerEmoji[type];
    return (
      this.openContextMenu(messageCellIndex)
        .perform(() => waitToAppearAndClick(ContextMenu.showMoreReactions, { index: 0 }))
        // The sheet renders every emoji up front, which takes a few seconds on an emulator.
        .perform(() => waitToAppearAndClick(ContextMenu.emoji(emoji), { index: 0, timeout: 30000 }))
    );
  }

  tapOnMessageReaction(type: string): this {
    return this.perform(() =>
      waitToAppearAndClick(MessageList.Message.Reactions.reaction(type), { index: 0 }),
    );
  }

  tapOnAlertButton(text: string): this {
    return this.perform(() => waitToAppearAndClick(Alert.button(text)));
  }

  /**
   * Deletes the `messageCellIndex`-th message from the newest. `hard` picks the E2E app's own hard
   * delete action: the SDK leaves it out of the menu on purpose (RN-504).
   */
  deleteMessage(messageCellIndex = 0, hard = false): this {
    return this.openContextMenu(messageCellIndex)
      .tapOnContextMenuAction(hard ? 'hardDeleteMessage' : 'deleteMessage')
      .tapOnAlertButton('Delete');
  }

  editMessage(newText: string, messageCellIndex = 0): this {
    return this.perform(() => editMessageNow(newText, messageCellIndex));
  }

  /** Opens the thread of the `messageCellIndex`-th message, from its menu or its replies label. */
  openThread(messageCellIndex = 0, usingContextMenu = true): this {
    const opened = usingContextMenu
      ? this.openContextMenu(messageCellIndex).tapOnContextMenuAction('threadReply')
      : this.perform(async () => {
          const index = await indexFromBottom(MessageList.Message.threadRepliesLabel, 0);
          await waitToAppearAndClick(MessageList.Message.threadRepliesLabel, { index });
        });
    return opened.perform(() => waitToAppear(Composer.alsoSendToChannelCheckbox));
  }

  /**
   * iOS types key by key, like XCUITest. Android sets the text, like the native suite's
   * `typeText` (UiAutomator `setText`): typing through the soft keyboard leaves the text in the
   * IME's composing state, which the composer doesn't pick up, so the send button never shows.
   * There `replaceText` always replaces the whole input, so Android appends to what is already
   * typed unless `replace` is set; iOS clears the input first when it is.
   */
  typeText(text: string, { replace = false }: { replace?: boolean } = {}): this {
    return this.perform(() => typeIntoComposer(text, replace));
  }

  clearComposer(): this {
    return this.perform(async () => {
      const inputField = await waitToAppear(Composer.inputField);
      await inputField.clearText();
    });
  }

  /**
   * Waits for the send button to be enabled first: without Espresso's synchronization (iOS, and
   * suites that turn it off) a tap right after typing lands before the composer has the text.
   */
  tapOnSendButton(): this {
    return this.perform(async () => {
      await waitToAppear(Composer.sendButton);
      await waitUntil(
        async () => (await allAttributes(Composer.sendButton))[0]?.enabled !== false,
        5000,
      );
      await waitToAppearAndClick(Composer.sendButton);
    });
  }

  sendMessage(text: string): this {
    return this.typeText(text).tapOnSendButton();
  }

  sendMessageInThread(text: string, alsoSendInChannel = false): this {
    if (alsoSendInChannel) {
      this.perform(() => waitToAppearAndClick(Composer.alsoSendToChannelCheckbox));
    }
    return this.sendMessage(text);
  }

  tapOnBackButton(): this {
    return this.perform(async () => {
      // The thread stacks over the channel, each with its own header: the top one is the last.
      const backButtons = await indexFromBottom(Header.backButton, 0).catch(() => 0);
      await waitToAppearAndClick(Header.backButton, { index: backButtons });
    });
  }

  /** Android hardware back; iOS has none, so it taps the header's back button there. */
  pressBack(): this {
    return this.perform(async () => {
      if (device.getPlatform() === 'android') {
        await device.pressBack();
      } else {
        await waitToAppearAndClick(Header.backButton);
      }
    });
  }

  tapOnScrollToBottomButton(): this {
    return this.perform(() => waitToAppearAndClick(MessageList.scrollToBottomButton));
  }

  moveToChannelListFromMessageList(): this {
    return this.tapOnBackButton()
      .perform(() => waitToDisappear(Composer.inputField))
      .waitForChannelListToLoad();
  }

  moveToChannelListFromThread(): this {
    return this.tapOnBackButton()
      .perform(() => waitToDisappear(Composer.alsoSendToChannelCheckbox))
      .moveToChannelListFromMessageList();
  }

  tapOnMessageList(): this {
    return this.perform(async () => {
      // The upper part: the suggestions and the keyboard cover the lower one.
      const list = await waitToAppear(MessageList.scrollTarget, { index: 0 });
      const frame = await frameOf(MessageList.scrollTarget);
      await list.tap({ x: frame.width / 2, y: frame.height / 4 });
    });
  }

  openComposerCommands(): this {
    return this.typeText('/');
  }

  tapOnGiphyCommandSuggestion(): this {
    return this.perform(() => waitToAppearAndClick(Composer.commandSuggestionWithName('Giphy')));
  }

  mentionParticipant({
    send = true,
    useSuggestions = true,
  }: { send?: boolean; useSuggestions?: boolean } = {}): this {
    if (useSuggestions) {
      this.typeText('@').perform(() =>
        waitToAppearAndClick(Composer.userSuggestionWithName(ParticipantRobot.userName)),
      );
    } else {
      this.typeText(`@${ParticipantRobot.userName}`);
    }
    return send ? this.tapOnSendButton() : this;
  }

  scrollChannelListDown(times = 3): this {
    return this.swipe(ChannelList.channelList, 'up', times);
  }

  scrollChannelListUp(times = 3): this {
    return this.swipe(ChannelList.channelList, 'down', times);
  }

  scrollMessageListDown(times = 3): this {
    // The message list is inverted: newer messages are at the bottom, reached by swiping up.
    return this.swipe(MessageList.scrollTarget, 'up', times);
  }

  scrollMessageListUp(times = 3): this {
    return this.swipe(MessageList.scrollTarget, 'down', times);
  }

  scrollMessageListDownToMessage(text: string, maxScrolls = 10): this {
    return this.perform(async () => {
      for (let i = 0; i < maxScrolls && !(await isDisplayed(MessageList.Message.text(text))); i++) {
        await (await waitToAppear(MessageList.scrollTarget, { index: 0 })).swipe('up', 'slow', 0.5);
        await sleep(300);
      }
    });
  }

  scrollMessageListUpToMessage(text: string, maxScrolls = 10): this {
    return this.perform(async () => {
      for (let i = 0; i < maxScrolls && !(await isDisplayed(MessageList.Message.text(text))); i++) {
        await (
          await waitToAppear(MessageList.scrollTarget, { index: 0 })
        ).swipe('down', 'slow', 0.5);
        await sleep(300);
      }
    });
  }

  backgroundApp(): this {
    return this.perform(() => device.sendToHome());
  }

  foregroundApp(): this {
    return this.perform(() => device.launchApp({ newInstance: false }));
  }

  private swipe(list: Detox.NativeMatcher, direction: Detox.Direction, times: number): this {
    return this.perform(async () => {
      const target = await waitToAppear(list, { index: 0 });
      for (let i = 0; i < times; i++) {
        await target.swipe(direction, 'fast', 0.6);
      }
    });
  }
}

/** {@link UserRobot.typeText} outside a robot chain, for asserts that type as part of a check. */
export const typeIntoComposer = async (text: string, replace = false) => {
  const inputField = await waitToAppear(Composer.inputField);
  if (device.getPlatform() === 'android') {
    const current = replace ? '' : await currentComposerText();
    if (isTrigger(text)) {
      // A trigger has to arrive as a key press: `replaceText` sets the text without the selection
      // change the composer's suggestions listen for. A single symbol is never left composing.
      if (replace) {
        await inputField.clearText();
      }
      await inputField.typeText(text);
    } else {
      await inputField.replaceText(`${current}${text}`);
    }
  } else {
    if (replace) {
      await inputField.clearText();
    }
    await inputField.typeText(text);
  }
};

/** Edits the `messageCellIndex`-th message from the newest, outside a robot chain. */
export const editMessageNow = async (newText: string, messageCellIndex = 0) => {
  const index = await indexFromBottom(MessageList.messageContents, messageCellIndex);
  await waitToAppearAndLongPress(MessageList.messageContents, { index });
  await waitToAppearAndClick(ContextMenu.action('editMessage'), { index: 0 });
  // Typing before the composer enters edit mode sends the text as a new message.
  await waitToAppear(Composer.editPreview);
  await typeIntoComposer(newText, true);
  await waitToAppearAndClick(Composer.sendButton);
};

const isTrigger = (text: string) => text === '/' || text === '@';

const currentComposerText = async () => {
  try {
    const attributes = (await element(Composer.inputField).getAttributes()) as { text?: string };
    return attributes.text ?? '';
  } catch {
    return '';
  }
};
