import { useMemo } from 'react';

import type { ScheduledMessageResponse } from 'stream-chat';
import { SCHEDULED_MESSAGE_FAILURE_REASON, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import type { IconsMap } from '../../../contexts/componentsContext/defaultComponents';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import type { ActionItem } from '../../../hooks/actions/types';

// Required lazily: a static import of defaultComponents.ts would form a cycle
// (defaultComponents -> ScheduledMessageActionsSheet -> this file) and corrupt init order.
let cachedDefaultIcons: IconsMap | undefined;
const getDefaultIcons = (): IconsMap => {
  if (!cachedDefaultIcons) {
    cachedDefaultIcons = (
      require('../../../contexts/componentsContext/defaultComponents') as { defaultIcons: IconsMap }
    ).defaultIcons;
  }
  return cachedDefaultIcons;
};

export type ScheduledMessageActionItem = ActionItem<
  'copyMessageText' | 'delete' | 'edit' | 'reschedule' | 'sendNow' | string
>;

/** The actions of one scheduled message, bound to it. */
export type ScheduledMessageActions = {
  copyMessageText: () => void;
  /** Asks for confirmation, then deletes the message. */
  delete: () => void;
  /** Opens the date and time sheet. */
  reschedule: () => void;
  sendNow: () => void;
  /** Opens the message in a composer. Absent where the list has nowhere to edit. */
  edit?: () => void;
};

export type ScheduledMessageActionItemsParams = {
  actions: ScheduledMessageActions;
  icons: IconsMap;
  scheduledMessage: ScheduledMessageResponse;
  t: TranslationContextValue['t'];
};

export type BuildDefaultScheduledMessageActionItems = (
  scheduledMessageActionItemsParams: Omit<ScheduledMessageActionItemsParams, 'icons'> & {
    icons?: IconsMap;
  },
) => ScheduledMessageActionItem[];

/**
 * The default actions of a scheduled message, by its status: none while it is sending; edit,
 * reschedule, send now and delete while it waits; edit, reschedule and delete once it failed; copy
 * and delete once its channel was deleted. Edit also needs `actions.edit`.
 */
export const buildDefaultScheduledMessageActionItems: BuildDefaultScheduledMessageActionItems = ({
  actions,
  icons = getDefaultIcons(),
  scheduledMessage: { failure_reason, status },
  t,
}) => {
  if (status === SCHEDULED_MESSAGE_STATUS.Sending) return [];

  const copyMessageText: ScheduledMessageActionItem = {
    action: actions.copyMessageText,
    Icon: icons.Copy,
    id: 'copyMessageText',
    label: t('scheduledMessages.copyText.label', 'Copy text'),
    type: 'standard',
  };
  const deleteItem: ScheduledMessageActionItem = {
    action: actions.delete,
    Icon: icons.Delete,
    id: 'delete',
    label: t('scheduledMessages.delete.label', 'Delete'),
    type: 'destructive',
  };

  if (
    status === SCHEDULED_MESSAGE_STATUS.Failed &&
    failure_reason === SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted
  ) {
    return [copyMessageText, deleteItem];
  }

  const items: ScheduledMessageActionItem[] = [];
  if (actions.edit) {
    items.push({
      action: actions.edit,
      Icon: icons.Edit,
      id: 'edit',
      label: t('scheduledMessages.editMessage.label', 'Edit message'),
      type: 'standard',
    });
  }
  items.push({
    action: actions.reschedule,
    Icon: icons.Time,
    id: 'reschedule',
    label: t('scheduledMessages.reschedule.label', 'Reschedule'),
    type: 'standard',
  });
  // A failed message can't be sent as it is.
  if (status !== SCHEDULED_MESSAGE_STATUS.Failed) {
    items.push({
      action: actions.sendNow,
      Icon: icons.SendRight,
      id: 'sendNow',
      label: t('scheduledMessages.sendNow.label', 'Send now'),
      type: 'standard',
    });
  }
  items.push(deleteItem);
  return items;
};

export type GetScheduledMessageActionItems = (params: {
  context: ScheduledMessageActionItemsParams;
  defaultItems: ScheduledMessageActionItem[];
}) => ScheduledMessageActionItem[];

export const getScheduledMessageActionItems: GetScheduledMessageActionItems = ({ defaultItems }) =>
  defaultItems;

type UseScheduledMessageActionItemsParams = {
  actions: ScheduledMessageActions;
  scheduledMessage: ScheduledMessageResponse;
  getScheduledMessageActionItems?: GetScheduledMessageActionItems;
};

/** The action items of a scheduled message: the defaults, customized by `getScheduledMessageActionItems`. */
export const useScheduledMessageActionItems = ({
  actions,
  scheduledMessage,
  getScheduledMessageActionItems:
    getScheduledMessageActionItemsProp = getScheduledMessageActionItems,
}: UseScheduledMessageActionItemsParams) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();

  const scheduledMessageActionItemsParams = useMemo<ScheduledMessageActionItemsParams>(
    () => ({ actions, icons, scheduledMessage, t }),
    [actions, icons, scheduledMessage, t],
  );

  const defaultItems = useMemo(
    () => buildDefaultScheduledMessageActionItems(scheduledMessageActionItemsParams),
    [scheduledMessageActionItemsParams],
  );

  return useMemo(
    () =>
      getScheduledMessageActionItemsProp({
        context: scheduledMessageActionItemsParams,
        defaultItems,
      }),
    [defaultItems, getScheduledMessageActionItemsProp, scheduledMessageActionItemsParams],
  );
};
