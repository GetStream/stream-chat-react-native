import * as sdk from '../../../index';

import type { ChannelContextValue } from '../../../index';
// Type-only half: these fail to COMPILE if the hooks stop being exported, which a runtime
// check cannot catch.
import type { useActiveMessagePaginator, useIsTargetedMessage } from '../../../index';

/**
 * `ChannelContextValue`'s shape, pinned.
 *
 * This context is read by every message row, so anything on it is re-read by the whole list. Five
 * members were removed for that reason — `loading`, `highlightedMessageId`, `loadChannelAroundMessage`,
 * `loadChannelAtFirstUnreadMessage`, `reloadChannel` — each of which made `<Channel>` subscribe to the
 * paginator and re-render on channel traffic. Their replacements live on the paginator itself.
 *
 * Two directions matter and both are enforced below:
 *
 * - **Nothing per-message may come back.** A member whose value changes as messages arrive re-renders
 *   every consumer, which is the regression this guards.
 * - **The replacements must stay exported.** The removals are a documented breaking change
 *   (`ai-docs/ai-migration-v9-to-v10.md` §6, §8); if the replacement hooks vanish, the guide is a lie
 *   and integrators have no path at all.
 */
describe('ChannelContext public surface', () => {
  it('exports the replacements the migration guide points at', () => {
    // Runtime half — the guide's §8 table is unusable without these.
    expect(typeof sdk.useActiveMessagePaginator).toBe('function');
    expect(typeof sdk.useIsTargetedMessage).toBe('function');
    expect(typeof sdk.useChannelContext).toBe('function');
    expect(sdk.DEFAULT_HIGHLIGHT_DURATION).toBe(3000);

    // Type half — asserted by construction (this file IS typechecked, via tsconfig.test.json).
    type Paginator = typeof useActiveMessagePaginator;
    type Targeted = typeof useIsTargetedMessage;
    const types: [Paginator, Targeted] | undefined = undefined;
    expect(types).toBeUndefined();
  });

  it('keeps the removed members off the context type', () => {
    // `@ts-expect-error` is the assertion: each line FAILS THE BUILD if the member comes back, which
    // is what makes this a guard rather than a comment.
    type Removed = {
      // @ts-expect-error `loading` — select it off the paginator inside the component that needs it.
      loading: ChannelContextValue['loading'];
      // @ts-expect-error `highlightedMessageId` — use `useIsTargetedMessage(messageId)` per row.
      highlightedMessageId: ChannelContextValue['highlightedMessageId'];
      // @ts-expect-error `loadChannelAroundMessage` — use `paginator.jumpToMessage(...)`.
      loadChannelAroundMessage: ChannelContextValue['loadChannelAroundMessage'];
      // @ts-expect-error `loadChannelAtFirstUnreadMessage` — use `paginator.jumpToTheFirstUnreadMessage(...)`.
      loadChannelAtFirstUnreadMessage: ChannelContextValue['loadChannelAtFirstUnreadMessage'];
      // @ts-expect-error `reloadChannel` — use `paginator.jumpToTheLatestMessage()`.
      reloadChannel: ChannelContextValue['reloadChannel'];
    };
    const removed: Removed | undefined = undefined;
    expect(removed).toBeUndefined();
  });

  it('still carries the members integrators read from it', () => {
    // Guards the other direction: this cleanup must not have taken anything else with it.
    const expected: Array<keyof ChannelContextValue> = [
      'channel',
      'disabled',
      'enableMessageGroupingByUser',
      'enforceUniqueReaction',
      'hasPendingInitialTargetLoad',
      'hideDateSeparators',
      'hideStickyDateHeader',
      'isChannelActive',
      'maxTimeBetweenGroupedMessages',
      'scrollToFirstUnreadThreshold',
      'threadList',
    ];
    // An assertion by construction: a removed member fails to compile in the array above.
    // 11 since the V10 merge: message pruning removed `maximumMessageLimit` in favour of
    // `maxLoadedItems`, derived inside `useMessageList`.
    expect(expected).toHaveLength(11);
  });
});
