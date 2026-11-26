import { CORE_NOTIFICATION_TYPE, StreamAPIError } from 'stream-chat';
import type { CommandSuggestionDisabledReason, Notification } from 'stream-chat';

import type { StreamTFunction } from '../../../i18n/types';
import { getNotificationDisplayMessage } from '../notificationTranslations';

/** Resolves each key to its inline default, which is what an untranslated locale renders. */
const t = ((key: string, defaultValue?: string) => defaultValue ?? key) as StreamTFunction;

const buildNotification = (overrides: Partial<Notification> = {}): Notification =>
  ({
    createdAt: 0,
    id: 'n1',
    message: 'developer-facing fallback',
    origin: { emitter: 'MessageComposer' },
    ...overrides,
  }) as Notification;

describe('getNotificationDisplayMessage', () => {
  /**
   * `metadata.reason` is typed `CommandSuggestionDisabledReason` in `stream-chat`, so the branches
   * here have to match the values it actually emits. They previously read `'replying'`, which the
   * client never produces -- so the reply case fell through to the generic copy silently.
   *
   * The `satisfies` below is the guard that matters: rename a reason in core and this stops
   * compiling, rather than quietly falling through again.
   */
  describe(CORE_NOTIFICATION_TYPE.commandDisabled, () => {
    const reasons = {
      editing: 'Command not available while editing',
      quoted_message: 'Command not available while replying',
    } satisfies Record<CommandSuggestionDisabledReason, string>;

    it.each(Object.entries(reasons))('renders the copy for %s', (reason, expected) => {
      const notification = buildNotification({
        metadata: { command: 'giphy', reason },
        type: CORE_NOTIFICATION_TYPE.commandDisabled,
      });

      expect(getNotificationDisplayMessage({ notification, t })).toBe(expected);
    });

    it('falls back to the generic copy when no reason is given', () => {
      const notification = buildNotification({
        metadata: { command: 'giphy' },
        type: CORE_NOTIFICATION_TYPE.commandDisabled,
      });

      expect(getNotificationDisplayMessage({ notification, t })).toBe('Command not available');
    });
  });

  /** An identifier no translator claims renders `message` verbatim rather than an empty toast. */
  it('passes an unrecognized type through', () => {
    const notification = buildNotification({ type: 'someone:elses:identifier' });

    expect(getNotificationDisplayMessage({ notification, t })).toBe('developer-facing fallback');
  });
});

describe('scheduled message notifications', () => {
  it.each([
    ['sent', 'This message was already sent'],
    ['deleted', 'This scheduled message was deleted'],
    ['failed', 'This scheduled message failed to send'],
  ])('renders the copy for an edit that ended because the message was %s', (reason, expected) => {
    const notification = buildNotification({
      metadata: { reason },
      type: CORE_NOTIFICATION_TYPE.scheduledMessageCompositionEnded,
    });

    expect(getNotificationDisplayMessage({ notification, t })).toBe(expected);
  });

  it('renders the command copy for a blocked command', () => {
    const notification = buildNotification({
      metadata: { reason: 'command' },
      type: CORE_NOTIFICATION_TYPE.scheduledMessageBlocked,
    });

    expect(getNotificationDisplayMessage({ notification, t })).toBe("Commands can't be scheduled");
  });

  it('maps the server error of a failed schedule to its copy', () => {
    const originalError = new StreamAPIError('limit', {
      code: 118,
      response: undefined,
      status: 400,
    });
    const notification = buildNotification({
      originalError,
      type: CORE_NOTIFICATION_TYPE.scheduledMessageCreateFailed,
    });

    expect(getNotificationDisplayMessage({ notification, t })).toBe(
      "You've reached your limit of scheduled messages.",
    );
  });
});
