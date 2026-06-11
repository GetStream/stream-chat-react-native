import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsActionItem } from './ChannelDetailsActionItem';
import { ChannelDetailsModal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';
import { PinnedMessageList } from './navigation-section/PinnedMessageList';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { ChevronRight } from '../../../icons';
import { File } from '../../../icons/file';
import { ImageGrid } from '../../../icons/gallery';
import { Pin } from '../../../icons/pin';
import type { IconProps } from '../../../icons/utils/base';
import { primitives } from '../../../theme';

/**
 * @experimental This type is experimental and is subject to change.
 */
export type ChannelDetailsNavigationSectionType = 'pinned-messages' | 'photos-and-videos' | 'files';

/**
 * Maps each navigation section to the icon and (translatable) label rendered for its row and,
 * when opened, its modal header. The declaration order also drives the order of the rendered rows.
 */
const SECTION_CONFIG: Record<
  ChannelDetailsNavigationSectionType,
  { Icon: React.ComponentType<IconProps>; label: string }
> = {
  'pinned-messages': { Icon: Pin, label: 'Pinned Messages' },
  'photos-and-videos': { Icon: ImageGrid, label: 'Photos & Videos' },
  files: { Icon: File, label: 'Files' },
};

const SECTIONS = Object.keys(SECTION_CONFIG) as ChannelDetailsNavigationSectionType[];

export type ChannelDetailsNavigationSectionProps = {
  /**
   * Fired when the user taps a navigation row, with the selected section. When provided, all rows
   * are interactive and emit their section. When omitted, only "Pinned Messages" is interactive and
   * opens the built-in modal.
   */
  onPress?: (section: ChannelDetailsNavigationSectionType) => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsNavigationSection = ({
  onPress,
}: ChannelDetailsNavigationSectionProps) => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailsContext();
  const {
    theme: {
      channelDetails: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const [activeSection, setActiveSection] = useState<ChannelDetailsNavigationSectionType | null>(
    null,
  );

  const handlePress = useCallback(
    (section: ChannelDetailsNavigationSectionType) => {
      if (onPress) {
        onPress(section);
        return;
      }
      // Only the pinned messages screen exists by default for now.
      if (section === 'pinned-messages') {
        setActiveSection(section);
      }
    },
    [onPress],
  );

  const closeModal = useCallback(() => setActiveSection(null), []);

  const modalContent = useMemo(() => {
    switch (activeSection) {
      case 'pinned-messages':
        return <PinnedMessageList channel={channel} />;
      default:
        return null;
    }
  }, [activeSection, channel]);

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
        {SECTIONS.map((section) => {
          const { Icon, label } = SECTION_CONFIG[section];
          // In default mode only "Pinned Messages" opens a built-in screen; the other rows become
          // interactive only when the consumer provides an onPress handler to route them.
          const interactive = onPress || section === 'pinned-messages';
          return (
            <ChannelDetailsActionItem
              Icon={Icon}
              key={section}
              label={t(label)}
              onPress={interactive ? () => handlePress(section) : undefined}
              testID={`channel-details-${section}`}
              trailing={chevron}
            />
          );
        })}
      </View>
      {onPress ? null : (
        <ChannelDetailsModal onClose={closeModal} visible={activeSection !== null}>
          {activeSection ? (
            <ModalHeader onClose={closeModal} title={t(SECTION_CONFIG[activeSection].label)} />
          ) : null}
          {modalContent}
        </ChannelDetailsModal>
      )}
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
