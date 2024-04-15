import { AppState, AppStateStatus } from 'react-native';

import { renderHook, waitFor } from '@testing-library/react-native';

import { useAppStateListener } from '../useAppStateListener';

describe('useAppStateListener', () => {
  const onForegroundFn = jest.fn();
  const onBackgroundFn = jest.fn();
  const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
  AppState.currentState = 'active';

  it.each<[AppStateStatus, jest.Mock, number]>([
    ['background', onBackgroundFn, 1],
    ['active', onForegroundFn, 1],
    ['inactive', onBackgroundFn, 2],
    ['active', onForegroundFn, 2],
    ['background', onBackgroundFn, 3],
  ])(
    'Appropriate callback called when appstate is changed to %s)',
    async (newAppState, expectedCallback, times) => {
      renderHook(
        (props: {
          onBackground?: (() => void) | undefined;
          onForeground?: (() => void) | undefined;
        }) => useAppStateListener(props.onForeground, props.onBackground),
        {
          initialProps: {
            onBackground: onBackgroundFn,
            onForeground: onForegroundFn,
          },
        },
      );
      const appStateOnChangeMockFunc = addEventListenerSpy.mock.calls[0][1];

      appStateOnChangeMockFunc(newAppState);
      await waitFor(() => {
        expect(expectedCallback).toHaveBeenCalledTimes(times);
      });
    },
  );
  it('check unmount behavior', async () => {
    jest.clearAllMocks();
    const { unmount } = renderHook(
      (props: {
        onBackground?: (() => void) | undefined;
        onForeground?: (() => void) | undefined;
      }) => useAppStateListener(props.onForeground, props.onBackground),
      {
        initialProps: {
          onBackground: onBackgroundFn,
          onForeground: onForegroundFn,
        },
      },
    );
    const { remove: appStateOnChangeSubscriptionRemoveMockFunc } =
      addEventListenerSpy.mock.results[0].value;

    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).not.toHaveBeenCalled();
    });
    unmount();
    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).toHaveBeenCalled();
    });
  });
});
