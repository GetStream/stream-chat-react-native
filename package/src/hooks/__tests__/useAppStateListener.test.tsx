import { AppState, AppStateStatus } from 'react-native';

import { renderHook } from '@testing-library/react-hooks/pure';
import { waitFor } from '@testing-library/react-native';

import { useAppStateListener } from '../useAppStateListener';

describe('useAppStateListener', () => {
  const onForeground = jest.fn();
  const onBackground = jest.fn();
  const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
  AppState.currentState = 'active';
  const { unmount } = renderHook(() => useAppStateListener(onForeground, onBackground));
  const appStateOnChangeMockFunc = addEventListenerSpy.mock.calls[0][1];
  const { remove: appStateOnChangeSubscriptionRemoveMockFunc } =
    addEventListenerSpy.mock.results[0].value;
  test.each<[AppStateStatus, jest.Mock, number]>([
    ['background', onBackground, 1],
    ['active', onForeground, 1],
    ['inactive', onBackground, 2],
    ['active', onForeground, 2],
    ['background', onBackground, 3],
  ])(
    'Appropriate callback called when appstate is changed to %s)',
    async (newAppState, expectedCallback, times) => {
      appStateOnChangeMockFunc(newAppState);
      await waitFor(() => {
        expect(expectedCallback).toHaveBeenCalledTimes(times);
      });
    },
  );
  test('check unmount behavior', async () => {
    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).not.toHaveBeenCalled();
    });
    unmount();
    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).toHaveBeenCalled();
    });
  });
});
