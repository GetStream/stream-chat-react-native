import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { SearchInput } from '../SearchInput';

type SearchInputProps = React.ComponentProps<typeof SearchInput>;

const renderComponent = (props: Partial<SearchInputProps> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <SearchInput accessibilityLabel='Search users' onChangeText={jest.fn()} {...props} />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('SearchInput', () => {
  it('renders the search-input testID', () => {
    renderComponent();

    expect(screen.getByTestId('search-input')).toBeTruthy();
  });

  it('forwards the accessibilityLabel prop to the underlying TextInput', () => {
    renderComponent({ accessibilityLabel: 'Search anything' });

    expect(screen.getByTestId('search-input').props.accessibilityLabel).toBe('Search anything');
  });

  it('does not render the clear button when the input is empty', () => {
    renderComponent();

    expect(screen.queryByTestId('clear-search')).toBeNull();
  });

  it('shows the clear button after typing and hides it after clearing', () => {
    renderComponent();

    fireEvent.changeText(screen.getByTestId('search-input'), 'abc');
    expect(screen.getByTestId('clear-search')).toBeTruthy();

    fireEvent.press(screen.getByTestId('clear-search'));
    expect(screen.queryByTestId('clear-search')).toBeNull();
  });

  it('calls onChangeText with each typed value', () => {
    const onChangeText = jest.fn();
    renderComponent({ onChangeText });

    fireEvent.changeText(screen.getByTestId('search-input'), 'foo');
    fireEvent.changeText(screen.getByTestId('search-input'), 'foobar');

    expect(onChangeText).toHaveBeenNthCalledWith(1, 'foo');
    expect(onChangeText).toHaveBeenNthCalledWith(2, 'foobar');
  });

  it('calls onChangeText with an empty string when the clear button is pressed', () => {
    const onChangeText = jest.fn();
    renderComponent({ onChangeText });

    fireEvent.changeText(screen.getByTestId('search-input'), 'x');
    fireEvent.press(screen.getByTestId('clear-search'));

    expect(onChangeText).toHaveBeenLastCalledWith('');
  });

  it('resets the visible value when the clear button is pressed', () => {
    renderComponent();

    fireEvent.changeText(screen.getByTestId('search-input'), 'typed');
    expect(screen.getByTestId('search-input').props.value).toBe('typed');

    fireEvent.press(screen.getByTestId('clear-search'));
    expect(screen.getByTestId('search-input').props.value).toBe('');
  });
});
