import { act, renderHook } from '@testing-library/react-native';

import type { LocalMessage } from 'stream-chat';

import { generateMessage } from '../../../../mock-builders/generator/message';
import { convertDateToTimestamp } from '../../../../mock-builders/generator/time';
import { useStickyHeaderDate } from '../useStickyHeaderDate';

describe('useStickyHeaderDate', () => {
  it('shows the date again after scrolling back down from the oldest message', () => {
    const topVisibleMessage = generateMessage({
      created_at: convertDateToTimestamp('2025-07-09T10:00:00.000Z'),
    }) as unknown as LocalMessage;
    const { result } = renderHook(() => useStickyHeaderDate());

    act(() =>
      result.current.updateStickyHeaderDate({ isAtOldestMessage: false, topVisibleMessage }),
    );
    expect(result.current.stickyHeaderDate?.toDateString()).toBe('Wed Jul 09 2025');

    act(() =>
      result.current.updateStickyHeaderDate({ isAtOldestMessage: true, topVisibleMessage }),
    );
    expect(result.current.stickyHeaderDate).toBeUndefined();

    act(() =>
      result.current.updateStickyHeaderDate({ isAtOldestMessage: false, topVisibleMessage }),
    );
    expect(result.current.stickyHeaderDate?.toDateString()).toBe('Wed Jul 09 2025');
  });
});
