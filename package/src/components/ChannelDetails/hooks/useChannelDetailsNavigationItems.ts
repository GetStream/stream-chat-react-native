import React, { useMemo } from 'react';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Picture } from '../../../icons';
import { Folder } from '../../../icons/folder';

import { Pin } from '../../../icons/pin';
import type { IconProps } from '../../../icons/utils/base';

/**
 * Identifies a navigation row. The literals are the built-in sections rendered by default;
 * consumers can also add their own rows with arbitrary section identifiers via `getNavigationItems`,
 * so any string is allowed.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type ChannelDetailsNavigationSectionType =
  | 'pinned-messages'
  | 'photos-and-videos'
  | 'files'
  | string;

/**
 * A single row in the channel details navigation section.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type ChannelDetailsNavigationItem = {
  /** Icon rendered at the start of the row and reused in the built-in modal header. */
  Icon: React.ComponentType<IconProps>;
  /** Already-translated label rendered for the row and its built-in modal header. */
  label: string;
  /** Identifies which built-in section this row represents. */
  section: ChannelDetailsNavigationSectionType;
  /**
   * Fired when the user taps the row. Leave unset to keep the built-in behavior (opening the
   * built-in modal for the section); set it to route the row somewhere else (e.g. your own screen).
   */
  onPress?: () => void;
};

/**
 * Maps each navigation section to the icon and (translatable) label rendered for its row and,
 * when opened, its modal header. The declaration order also drives the order of the rendered rows.
 */
const SECTION_CONFIG: Record<
  'pinned-messages' | 'photos-and-videos' | 'files',
  { Icon: React.ComponentType<IconProps>; label: string }
> = {
  'pinned-messages': { Icon: Pin, label: 'Pinned Messages' },
  'photos-and-videos': { Icon: Picture, label: 'Photos & Videos' },
  files: { Icon: Folder, label: 'Files' },
};

const SECTIONS = Object.keys(SECTION_CONFIG) as Array<keyof typeof SECTION_CONFIG>;

export type ChannelDetailsNavigationItemsContext = {
  t: TranslationContextValue['t'];
};

/**
 * Customizes the navigation rows rendered by `ChannelDetailsNavigationSection`. Receives the
 * built-in `defaultItems` (and a `context`) and returns the items to render. Map over
 * `defaultItems` to set a row's `onPress` (e.g. to push your own screen), or add/remove rows. Any
 * row whose `onPress` you leave unset keeps its built-in behavior (opening the built-in modal) —
 * including sections added in future SDK versions.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type GetChannelDetailsNavigationItems = (params: {
  context: ChannelDetailsNavigationItemsContext;
  defaultItems: ChannelDetailsNavigationItem[];
}) => ChannelDetailsNavigationItem[];

export const getChannelDetailsNavigationItems: GetChannelDetailsNavigationItems = ({
  defaultItems,
}) => defaultItems;

/**
 * Builds the navigation rows rendered by `ChannelDetailsNavigationSection`. Returns the items as a
 * plain array — the section component owns the built-in modal and supplies the default open-modal
 * behavior for any row without a custom `onPress`. Customize the rows by passing `getNavigationItems`
 * to `ChannelDetails` (see {@link GetChannelDetailsNavigationItems}).
 *
 * @experimental This hook is experimental and is subject to change.
 */
export const useChannelDetailsNavigationItems = (): ChannelDetailsNavigationItem[] => {
  const { t } = useTranslationContext();
  const { getNavigationItems = getChannelDetailsNavigationItems } = useChannelDetailsContext();

  const context = useMemo<ChannelDetailsNavigationItemsContext>(() => ({ t }), [t]);

  const defaultItems = useMemo<ChannelDetailsNavigationItem[]>(
    () =>
      SECTIONS.map((section) => {
        const { Icon, label } = SECTION_CONFIG[section];
        return { Icon, label: t(label), section };
      }),
    [t],
  );

  return useMemo(
    () => getNavigationItems({ context, defaultItems }),
    [context, defaultItems, getNavigationItems],
  );
};
