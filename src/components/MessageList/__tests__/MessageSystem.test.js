import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import MessageSystem from '../MessageSystem';
import {
  generateStaticUser,
  generateMessage,
  generateStaticMessage,
} from '../../../mock-builders';
import { Streami18n } from '../../../utils';
import { ThemeProvider } from '@stream-io/styled-components';
import { defaultTheme } from '../../../styles/theme';

afterEach(cleanup);

describe('MessageSystem', () => {
  it('should render the message system', async () => {
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const message = generateMessage();
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageSystem message={message} tDateTimeParser={tDateTimeParser} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('message-system')).toBeTruthy();
    });
  });

  it('should match the snapshot for message system', async () => {
    const i18nInstance = new Streami18n();
    const { tDateTimeParser } = await i18nInstance.getTranslators();
    const user = generateStaticUser(0);
    const message = generateStaticMessage('Hello World', { user });
    const { toJSON } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageSystem message={message} tDateTimeParser={tDateTimeParser} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
