import { AppState, AppStateStatus } from 'react-native';

import { renderHook, waitFor } from '@testing-library/react-native';

import { useAppStateListener } from '../useAppStateListener';

describe('useAppStateListener', () => {
  const renderListener = (onForegroundFn: jest.Mock, onBackgroundFn: jest.Mock) => {
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    addEventListenerSpy.mockClear();
    const utils = renderHook(() => useAppStateListener(onForegroundFn, onBackgroundFn));
    const emit = addEventListenerSpy.mock.calls[0][1] as (state: AppStateStatus) => void;
    return { ...utils, addEventListenerSpy, emit };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = 'active';
  });

  it('calls onBackground when the app is backgrounded', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const { emit } = renderListener(onForeground, onBackground);

    emit('inactive');
    emit('background');

    await waitFor(() => {
      expect(onBackground).toHaveBeenCalledTimes(1);
    });
    expect(onForeground).not.toHaveBeenCalled();
  });

  it('calls onForeground when the app returns to active from background', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const { emit } = renderListener(onForeground, onBackground);

    emit('inactive');
    emit('background');
    emit('inactive');
    emit('active');

    await waitFor(() => {
      expect(onForeground).toHaveBeenCalledTimes(1);
    });
    expect(onBackground).toHaveBeenCalledTimes(1);
  });

  // Regression: an app in Split View sits `inactive` while fully visible. Treating that as
  // backgrounded closed the WebSocket while the user was reading the chat.
  it('does NOT treat `inactive` as backgrounded', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const { emit } = renderListener(onForeground, onBackground);

    emit('inactive');
    emit('active');
    emit('inactive');

    await waitFor(() => {
      expect(onBackground).not.toHaveBeenCalled();
    });
    expect(onForeground).not.toHaveBeenCalled();
  });

  it('fires each callback once per transition even with repeated events', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const { emit } = renderListener(onForeground, onBackground);

    emit('background');
    emit('background');
    emit('active');
    emit('active');

    await waitFor(() => {
      expect(onBackground).toHaveBeenCalledTimes(1);
    });
    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('check unmount behavior', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const { addEventListenerSpy, unmount } = renderListener(onForeground, onBackground);

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
