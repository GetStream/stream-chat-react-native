import React, { useMemo } from 'react';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { asDynamicKey } from '../../../i18n/utils';
import type { IconProps } from '../../../icons/utils/base';

/**
 * Identifies a navigation row: one of the built-in sections or, for rows added through
 * `getNavigationItems`, any string.
 */
export type ChannelDetailsNavigationSectionType =
  | 'pinned-messages'
  | 'photos-and-videos'
  | 'files'
  | string;

/** A row in the channel details navigation section. */
export type ChannelDetailsNavigationItem = {
  /** Icon at the start of the row, reused in the built-in modal header. */
  Icon: React.ComponentType<IconProps>;
  /** Translated label of the row, reused in the built-in modal header. */
  label: string;
  /** The section this row represents. */
  section: ChannelDetailsNavigationSectionType;
  /** Fired when the row is tapped. When unset, the row opens the built-in modal for its section. */
  onPress?: () => void;
};

/**
 * Maps each built-in section to its icon (a key of the components-context icons map) and label key.
 * The declaration order is the order of the rows.
 */
const SECTION_CONFIG: Record<
  'pinned-messages' | 'photos-and-videos' | 'files',
  { icon: 'Pin' | 'Picture' | 'Folder'; label: string }
> = {
  'pinned-messages': { icon: 'Pin', label: 'channelDetails.navigation.pinnedMessages.label' },
  'photos-and-videos': {
    icon: 'Picture',
    label: 'channelDetails.navigation.photosAndVideos.label',
  },
  files: { icon: 'Folder', label: 'channelDetails.navigation.files.label' },
};

const SECTIONS = Object.keys(SECTION_CONFIG) as Array<keyof typeof SECTION_CONFIG>;

export type ChannelDetailsNavigationItemsContext = {
  t: TranslationContextValue['t'];
};

/**
 * Customizes the rows rendered by `ChannelDetailsNavigationSection`. Receives the built-in
 * `defaultItems` (and a `context`) and returns the rows to render. Set a row's `onPress` to route
 * it elsewhere, or add and remove rows. A row without `onPress` opens the built-in modal.
 */
export type GetChannelDetailsNavigationItems = (params: {
  context: ChannelDetailsNavigationItemsContext;
  defaultItems: ChannelDetailsNavigationItem[];
}) => ChannelDetailsNavigationItem[];

export const getChannelDetailsNavigationItems: GetChannelDetailsNavigationItems = ({
  defaultItems,
}) => defaultItems;

/**
 * Builds the rows rendered by `ChannelDetailsNavigationSection`, customized by
 * {@link GetChannelDetailsNavigationItems}.
 *
 * @param params.getNavigationItems Customizes the default rows.
 * @returns The navigation rows.
 */
export const useChannelDetailsNavigationItems = ({
  getNavigationItems = getChannelDetailsNavigationItems,
}: {
  getNavigationItems?: GetChannelDetailsNavigationItems;
} = {}): ChannelDetailsNavigationItem[] => {
  const { icons } = useComponentsContext();
  const { t } = useTranslationContext();

  const context = useMemo<ChannelDetailsNavigationItemsContext>(() => ({ t }), [t]);

  const defaultItems = useMemo<ChannelDetailsNavigationItem[]>(
    () =>
      SECTIONS.map((section) => {
        const { icon, label } = SECTION_CONFIG[section];
        // The label key comes from `SECTION_CONFIG`, so it is only known at runtime.
        return { Icon: icons[icon], label: t(asDynamicKey(label)), section };
      }),
    [icons, t],
  );

  return useMemo(
    () => getNavigationItems({ context, defaultItems }),
    [context, defaultItems, getNavigationItems],
  );
};
