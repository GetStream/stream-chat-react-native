import React from 'react';
import { Button, Text } from 'react-native';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useResettableState } from './useResettableState';

const TestComponent = () => {
  const { data, reset, setData } = useResettableState(0);

  return (
    <>
      <Text testID='value'>{`${data}`}</Text>
      <Button
        onPress={() => {
          setData(data + 1);
        }}
        testID='increment'
        title='Super useful incrementer'
      />
      <Button
        onPress={() => {
          reset();
        }}
        testID='reset'
        title='Oh no, go back!'
      />
    </>
  );
};

const waitForOptions = {
  timeout: 1000,
};

test('useResettableState can be reset to its initial state', async () => {
  const { getByTestId } = render(<TestComponent />);

  await waitFor(() => expect(getByTestId('value').children[0]).toBe('0'), waitForOptions);

  fireEvent.press(getByTestId('increment'));
  await waitFor(() => expect(getByTestId('value').children[0]).toBe('1'), waitForOptions);

  fireEvent.press(getByTestId('reset'));
  await waitFor(() => expect(getByTestId('value').children[0]).toBe('0'), waitForOptions);
});
