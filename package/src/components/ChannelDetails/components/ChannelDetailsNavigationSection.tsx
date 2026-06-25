import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsActionItem } from './ChannelDetailsActionItem';
import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { ChevronRight } from '../../../icons';
import { ChevronLeft } from '../../../icons/chevron-left';
import { primitives } from '../../../theme';
import { ImageGallery } from '../../ImageGallery/ImageGallery';
import {
  type ChannelDetailsNavigationSectionType,
  type GetChannelDetailsNavigationItems,
  useChannelDetailsNavigationItems,
} from '../hooks/useChannelDetailsNavigationItems';

export type ChannelDetailsNavigationSectionProps = {
  /**
   * Customize the navigation rows rendered in the channel details navigation section.
   *
   * Receives the built-in `defaultItems` (and a `context`) and returns the rows to render.
   * Map over `defaultItems` to override a row's `onPress` (e.g. to push your own screen) or
   * to add/remove rows. Any row whose `onPress` you leave untouched keeps its built-in
   * behavior (opening the built-in modal), including sections added in future SDK versions.
   */
  getNavigationItems?: GetChannelDetailsNavigationItems;
};

export const ChannelDetailsNavigationSection = ({
  getNavigationItems,
}: ChannelDetailsNavigationSectionProps) => {
  const {
    theme: {
      channelDetails: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const { FileAttachmentList, MediaList, PinnedMessageList } = useComponentsContext();
  const items = useChannelDetailsNavigationItems({ getNavigationItems });
  const [activeSection, setActiveSection] = useState<ChannelDetailsNavigationSectionType | null>(
    null,
  );
  const { overlayOpacity, overlay } = useOverlayContext();
  const closeModal = useCallback(() => setActiveSection(null), []);

  const modalContent = useMemo(() => {
    switch (activeSection) {
      case 'pinned-messages':
        return <PinnedMessageList />;
      case 'photos-and-videos':
        return (
          <>
            <MediaList />
            {overlay === 'gallery' ? <ImageGallery overlayOpacity={overlayOpacity} /> : null}
          </>
        );
      case 'files':
        return <FileAttachmentList />;
      default:
        return null;
    }
  }, [activeSection, FileAttachmentList, MediaList, PinnedMessageList, overlayOpacity, overlay]);

  const activeItem = useMemo(
    () => items.find((item) => item.section === activeSection),
    [activeSection, items],
  );

  const chevron = useMemo(
    () => (
      <View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
        <ChevronRight height={20} stroke={semantics.textTertiary} width={20} />
      </View>
    ),
    [semantics.textTertiary],
  );

  const closeButtonProps = useMemo(
    () => ({ type: 'ghost' as const, LeadingIcon: ChevronLeft }),
    [],
  );

  return (
    <>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: semantics.backgroundCoreSurfaceCard },
          sectionCardOverride,
        ]}
      >
        {items.map((item) => (
          <ChannelDetailsActionItem
            Icon={item.Icon}
            key={item.section}
            label={item.label}
            onPress={item.onPress ?? (() => setActiveSection(item.section))}
            testID={`channel-details-${item.section}`}
            trailing={chevron}
          />
        ))}
      </View>
      <ChannelDetailsModal
        onClose={closeModal}
        visible={activeSection !== null}
        presentationStyle='fullScreen'
      >
        {activeItem ? (
          <ModalHeader
            onClose={closeModal}
            title={activeItem.label}
            additionalCloseButtonProps={closeButtonProps}
          />
        ) : null}
        {modalContent}
      </ChannelDetailsModal>
    </>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          borderRadius: primitives.radiusLg,
          overflow: 'hidden',
          paddingVertical: primitives.spacingXs,
          paddingHorizontal: primitives.spacingXxs,
        },
      }),
    [],
  );
};
