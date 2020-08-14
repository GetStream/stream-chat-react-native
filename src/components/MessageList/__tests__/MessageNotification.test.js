import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import MessageNotification from '../MessageNotification';
import { TranslationContext } from '../../../context';
import { Streami18n } from '../../../utils';

afterEach(cleanup);

describe('MessageNotification', () => {
  it('should render nothing if showNotification is false', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <TranslationContext.Provider value={translators}>
        <MessageNotification onPress={() => null} showNotification={false} />
      </TranslationContext.Provider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeFalsy();
    });
  });

  it('should render if showNotification is true', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <TranslationContext.Provider value={translators}>
        <MessageNotification onPress={() => null} showNotification={true} />
      </TranslationContext.Provider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeTruthy();
    });
  });

  it('should trigger onPress when pressed', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TranslationContext.Provider value={translators}>
        <MessageNotification onPress={onPress} showNotification={true} />
      </TranslationContext.Provider>,
    );
    fireEvent.press(getByTestId('message-notification'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should display the text New Messages', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { getByText } = render(
      <TranslationContext.Provider value={{ ...translators, t }}>
        <MessageNotification
          onPress={() => null}
          showNotification={true}
          t={t}
        />
      </TranslationContext.Provider>,
    );
    expect(t).toHaveBeenCalledWith('New Messages');
    await waitFor(() => {
      expect(getByText('New Messages')).toBeTruthy();
    });
  });

  it('should render the message notification and match snapshot', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { toJSON } = render(
      <TranslationContext.Provider value={translators}>
        <MessageNotification onPress={() => null} showNotification={true} />
      </TranslationContext.Provider>,
    );

    /**
     * Wait for animation to finish
     */
    await new Promise((r) => setTimeout(r, 500));
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
