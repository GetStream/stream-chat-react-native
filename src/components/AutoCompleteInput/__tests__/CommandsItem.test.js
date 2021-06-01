import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { CommandsItem } from '../CommandsItem';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

const args = 'a string list of args';
const description = 'test description';
const name = 'giphy';

describe('CommandsItem', () => {
  it('should render CommandsItem with no avatar image but a name', async () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider>
        <CommandsItem item={{ args, description, name }} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('commands-item-title')).toBeTruthy();
      expect(queryByTestId('commands-item-args')).toBeTruthy();
      expect(queryByTestId('commands-item-description')).toBeTruthy();
      expect(getByTestId('commands-item-title')).toHaveTextContent(`/${name}`);
      expect(getByTestId('commands-item-args')).toHaveTextContent(args);
      expect(getByTestId('commands-item-description')).toHaveTextContent(description);
    });
  });
});
