/* eslint-disable no-unused-vars */
/* eslint-disable jest/no-commented-out-tests */
import React, { useContext } from 'react';
import { View } from 'react-native';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { SuggestionsContext, TranslationContext } from '../../../context';
import { SuggestionsProvider } from '..';
import { act } from 'react-test-renderer';
import SuggestionsList from '../SuggestionsList';
import { themed, defaultTheme } from '../../../styles/theme';
import { ThemeProvider } from '@stream-io/styled-components';

const SuggestionsContextConsumer = ({ fn }) => {
  fn(useContext(SuggestionsContext));
  return <View testID='children' />;
};

describe('SuggestionsProvider', () => {
  afterEach(cleanup);

  it('renders children without crashing', async () => {
    const { getByTestId } = render(
      <SuggestionsProvider>
        <View testID='children' />
      </SuggestionsProvider>,
    );

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
  });

  it('exposes the suggestions context', async () => {
    let context;

    render(
      <SuggestionsProvider>
        <SuggestionsContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        ></SuggestionsContextConsumer>
      </SuggestionsProvider>,
    );

    await waitFor(() => {
      expect(context).toBeInstanceOf(Object);
      expect(context.closeSuggestions).toBeInstanceOf(Function);
      expect(context.openSuggestions).toBeInstanceOf(Function);
      expect(context.setInputBoxContainerRef).toBeInstanceOf(Function);
      expect(context.updateSuggestions).toBeInstanceOf(Function);
    });
  });

  // it('renders a list of mentions', () => {
  //   // let context;
  //   const suggestions = {
  //     data: [
  //       { id: '1', image: '', name: 'dan', onSelect: jest.fn() },
  //       { id: '2', image: '', name: 'neil', onSelect: jest.fn() },
  //     ],
  //   };

  //   const t = jest.fn((key) => key);

  //   const tree = renderer
  //     .create(
  //       <ThemeProvider theme={defaultTheme}>
  //         <TranslationContext.Provider value={{ t }}>
  //           <SuggestionsList
  //             active={true}
  //             componentType={'MentionsItem'}
  //             suggestions={suggestions}
  //           />
  //         </TranslationContext.Provider>
  //       </ThemeProvider>,
  //     )
  //     .toJSON();

  //   expect(tree).toMatchSnapshot();
  // });

  // it('renders a list of suggestions', async () => {
  //   let context;
  //   const suggestions = {
  //     data: [
  //       { id: '1', image: '', name: 'dan' },
  //       { id: '2', image: '', name: 'neil' },
  //     ],
  //   };

  //   render(
  //     <SuggestionsProvider>
  //       <SuggestionsContextConsumer
  //         fn={(ctx) => {
  //           context = ctx;
  //         }}
  //       ></SuggestionsContextConsumer>
  //     </SuggestionsProvider>,
  //   );

  //   const { updateSuggestions } = context;

  //   act(() => updateSuggestions(suggestions));
  // });
});
