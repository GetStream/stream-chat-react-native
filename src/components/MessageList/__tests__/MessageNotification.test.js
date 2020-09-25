import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import MessageNotification from '../MessageNotification';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { Streami18n } from '../../../utils/Streami18n';

afterEach(cleanup);

describe('MessageNotification', () => {
  it('should render nothing if showNotification is false', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <TranslationProvider value={translators}>
        <MessageNotification onPress={() => null} showNotification={false} />
      </TranslationProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeFalsy();
    });
  });

  it('should render if showNotification is true', async () => {
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { queryByTestId } = render(
      <TranslationProvider value={translators}>
        <MessageNotification onPress={() => null} showNotification={true} />
      </TranslationProvider>,
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
      <TranslationProvider value={translators}>
        <MessageNotification onPress={onPress} showNotification={true} />
      </TranslationProvider>,
    );
    fireEvent.press(getByTestId('message-notification'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should display the text New Messages', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const { getByText } = render(
      <TranslationProvider value={{ ...translators, t }}>
        <MessageNotification
          onPress={() => null}
          showNotification={true}
          t={t}
        />
      </TranslationProvider>,
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
      <TranslationProvider value={translators}>
        <MessageNotification onPress={() => null} showNotification={true} />
      </TranslationProvider>,
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
