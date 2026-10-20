import { Robot } from './Robot';

import { ChannelListPage } from '../pages/ChannelListPage';
import { LoginPage } from '../pages/LoginPage';
import { MessageListPage } from '../pages/MessageListPage';
import {
  waitToAppear,
  waitToAppearAndClick,
  waitToAppearAndLongPress,
  waitToDisappear,
} from '../support/Element';

const { ChannelList } = ChannelListPage;
const { Composer, Header, MessageList } = MessageListPage;

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

  openContextMenu(messageText: string): this {
    return this.perform(() => waitToAppearAndLongPress(MessageList.Message.text(messageText)));
  }

  /**
   * iOS types key by key, like XCUITest. Android sets the text, like the native suite's
   * `typeText` (UiAutomator `setText`): typing through the soft keyboard leaves the text in the
   * IME's composing state, which the composer doesn't pick up, so the send button never shows.
   */
  typeText(text: string): this {
    return this.perform(async () => {
      const inputField = await waitToAppear(Composer.inputField);
      if (device.getPlatform() === 'android') {
        await inputField.replaceText(text);
      } else {
        await inputField.typeText(text);
      }
    });
  }

  clearComposer(): this {
    return this.perform(async () => {
      const inputField = await waitToAppear(Composer.inputField);
      await inputField.clearText();
    });
  }

  tapOnSendButton(): this {
    return this.perform(() => waitToAppearAndClick(Composer.sendButton));
  }

  sendMessage(text: string): this {
    return this.typeText(text).tapOnSendButton();
  }

  tapOnBackButton(): this {
    return this.perform(() => waitToAppearAndClick(Header.backButton));
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

  scrollChannelListDown(times = 3): this {
    return this.swipe(ChannelList.channelList, 'up', times);
  }

  scrollChannelListUp(times = 3): this {
    return this.swipe(ChannelList.channelList, 'down', times);
  }

  scrollMessageListDown(times = 3): this {
    // The message list is inverted: newer messages are at the bottom, reached by swiping down.
    return this.swipe(MessageList.messageList, 'down', times);
  }

  scrollMessageListUp(times = 3): this {
    return this.swipe(MessageList.messageList, 'up', times);
  }

  backgroundApp(): this {
    return this.perform(() => device.sendToHome());
  }

  foregroundApp(): this {
    return this.perform(() => device.launchApp({ newInstance: false }));
  }

  private swipe(list: Detox.NativeMatcher, direction: Detox.Direction, times: number): this {
    return this.perform(async () => {
      const target = await waitToAppear(list);
      for (let i = 0; i < times; i++) {
        await target.swipe(direction, 'fast', 0.6);
      }
    });
  }
}
