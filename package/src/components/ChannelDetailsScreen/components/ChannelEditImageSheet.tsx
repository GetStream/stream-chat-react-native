import React, { useCallback, useMemo } from 'react';
import {
  I18nManager,
  ListRenderItem,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useBottomSheetContext } from '../../../contexts';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Camera } from '../../../icons/camera';
import { Delete } from '../../../icons/delete';
import { Picture } from '../../../icons/image';
import type { IconProps } from '../../../icons/utils/base';
import { NewClose } from '../../../icons/xmark';
import { primitives } from '../../../theme';
import { Button } from '../../ui/Button/Button';
import { BottomSheetModal } from '../../UIComponents/BottomSheetModal';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';

export type ChannelEditImageSheetProps = {
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
  /**
   * Optional handler for the destructive "Reset Picture" row. When omitted, the
   * row is hidden.
   */
  onSelectReset?: () => void;
  visible: boolean;
};

type SheetItem = {
  destructive?: boolean;
  Icon: React.ComponentType<IconProps>;
  id: 'take-photo' | 'choose-image' | 'reset-picture';
  label: string;
  onPress: () => void;
  testID: string;
};

const keyExtractor = (item: SheetItem) => item.id;

const ChannelEditImageSheetInner = ({
  onSelectCamera,
  onSelectLibrary,
  onSelectReset,
}: Omit<ChannelEditImageSheetProps, 'visible' | 'onClose'>) => {
  const { ChannelDetailsActionItem } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        editImageSheet: {
          actionsList: actionsListOverride,
          container: containerOverride,
          header: headerOverride,
          headerTitle: headerTitleOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const { close, dismiss } = useBottomSheetContext();

  const onSelect = useCallback(
    (callback: () => void) => {
      dismiss(callback);
    },
    [dismiss],
  );

  const items = useMemo<SheetItem[]>(() => {
    const base: SheetItem[] = [
      {
        Icon: Camera,
        id: 'take-photo',
        label: t('Take Photo'),
        onPress: () => {
          onSelect(onSelectCamera);
        },
        testID: 'channel-edit-picture-take-photo',
      },
      {
        Icon: Picture,
        id: 'choose-image',
        label: t('Choose Image'),
        onPress: () => {
          onSelect(onSelectLibrary);
        },
        testID: 'channel-edit-picture-choose-image',
      },
    ];

    if (onSelectReset) {
      base.push({
        destructive: true,
        Icon: Delete,
        id: 'reset-picture',
        label: t('Reset Picture'),
        onPress: () => {
          onSelect(onSelectReset);
        },
        testID: 'channel-edit-picture-reset',
      });
    }

    return base;
  }, [onSelect, onSelectCamera, onSelectLibrary, onSelectReset, t]);

  const renderItem = useCallback<ListRenderItem<SheetItem>>(
    ({ item }) => (
      <ChannelDetailsActionItem
        destructive={item.destructive}
        Icon={item.Icon}
        label={item.label}
        onPress={item.onPress}
        testID={item.testID}
      />
    ),
    [ChannelDetailsActionItem],
  );

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={[styles.header, headerOverride]}>
        <View style={styles.side}>
          <Button
            accessibilityLabelKey='a11y/Close edit picture sheet'
            iconOnly
            LeadingIcon={NewClose}
            onPress={() => close()}
            size='md'
            testID='channel-edit-picture-sheet-close-button'
            type='outline'
            variant='secondary'
          />
        </View>
        <View style={styles.center}>
          <Text
            accessibilityRole='header'
            numberOfLines={1}
            style={[styles.title, { color: semantics.textPrimary }, headerTitleOverride]}
          >
            {t('Edit Group Picture')}
          </Text>
        </View>
        <View style={[styles.side, styles.sideRight]} />
      </View>
      <StreamBottomSheetModalFlatList<SheetItem>
        contentContainerStyle={[styles.actionsList, actionsListOverride]}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </View>
  );
};

export const ChannelEditImageSheet = ({
  onClose,
  onSelectCamera,
  onSelectLibrary,
  onSelectReset,
  visible,
}: ChannelEditImageSheetProps) => {
  const handleSelectCamera = useStableCallback(onSelectCamera);
  const handleSelectLibrary = useStableCallback(onSelectLibrary);
  const handleSelectReset = useStableCallback(onSelectReset ?? (() => undefined));

  return (
    <BottomSheetModal enableDynamicSizing onClose={onClose} visible={visible}>
      <ChannelEditImageSheetInner
        onSelectCamera={handleSelectCamera}
        onSelectLibrary={handleSelectLibrary}
        onSelectReset={onSelectReset ? handleSelectReset : undefined}
      />
    </BottomSheetModal>
  );
};

const useStyles = () =>
  useMemo<{
    actionsList: ViewStyle;
    center: ViewStyle;
    container: ViewStyle;
    header: ViewStyle;
    side: ViewStyle;
    sideRight: ViewStyle;
    title: TextStyle;
  }>(
    () =>
      StyleSheet.create({
        actionsList: {
          paddingBottom: primitives.spacing3xl,
          paddingHorizontal: primitives.spacingXxs,
        },
        center: {
          alignItems: 'center',
          flex: 2,
          justifyContent: 'center',
        },
        container: {
          flexDirection: 'column',
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingSm,
          justifyContent: 'space-between',
          paddingBottom: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          paddingTop: primitives.spacingSm,
        },
        side: {
          flex: 1,
          justifyContent: 'center',
        },
        sideRight: {
          alignItems: 'flex-end',
        },
        title: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [],
  );
