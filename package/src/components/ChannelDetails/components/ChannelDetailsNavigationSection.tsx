import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsActionItem } from './ChannelDetailsActionItem';
import { ChannelDetailsOverlayProvider } from './modal/ChannelDetailsOverlayProvider';
import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { ChevronRight } from '../../../icons';
import { primitives } from '../../../theme';
import {
  type ChannelDetailsNavigationSectionType,
  useChannelDetailsNavigationItems,
} from '../hooks/useChannelDetailsNavigationItems';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsNavigationSection = () => {
  const {
    theme: {
      channelDetails: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const { FileAttachmentList, MediaList, PinnedMessageList } = useComponentsContext();
  const items = useChannelDetailsNavigationItems();
  const [activeSection, setActiveSection] = useState<ChannelDetailsNavigationSectionType | null>(
    null,
  );
  const closeModal = useCallback(() => setActiveSection(null), []);

  const modalContent = useMemo(() => {
    switch (activeSection) {
      case 'pinned-messages':
        return <PinnedMessageList />;
      case 'photos-and-videos':
        return (
          <ChannelDetailsOverlayProvider>
            <MediaList />
          </ChannelDetailsOverlayProvider>
        );
      case 'files':
        return <FileAttachmentList />;
      default:
        return null;
    }
  }, [activeSection, FileAttachmentList, MediaList, PinnedMessageList]);

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
      <ChannelDetailsModal onClose={closeModal} visible={activeSection !== null}>
        {activeItem ? <ModalHeader onClose={closeModal} title={activeItem.label} /> : null}
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
        },
      }),
    [],
  );
};
