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
import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { Camera } from '../../../icons/camera';
import { Delete } from '../../../icons/delete';
import { Picture } from '../../../icons/image';
import type { IconProps } from '../../../icons/utils/base';
import { NewClose } from '../../../icons/xmark';
import type {
  EditChannelDetailsState,
  EditChannelImagePendingAction,
} from '../../../state-store/edit-channel-details-store';
import { primitives } from '../../../theme';
import { Button } from '../../ui/Button/Button';
import { BottomSheetModal } from '../../UIComponents/BottomSheetModal';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';

export type ChannelEditImageSheetProps = {
  onClose: () => void;
  visible: boolean;
};

const selectCanReset = (state: EditChannelDetailsState) => ({
  canReset: Boolean(state.initialImage || state.updatedImage),
});

type SheetItem = {
  destructive?: boolean;
  Icon: React.ComponentType<IconProps>;
  id: 'take-photo' | 'choose-image' | 'reset-picture';
  label: string;
  onPress: () => void;
  testID: string;
};

const keyExtractor = (item: SheetItem) => item.id;

const ChannelEditImageSheetInner = () => {
  const { store } = useChannelEditDetailsContext();
  const { ChannelDetailsActionItem } = useComponentsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
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
  const { canReset } = useStateStore(store.state, selectCanReset);

  const onSelect = useCallback(
    (action: EditChannelImagePendingAction) => {
      dismiss(() => store.setPendingAction(action));
    },
    [dismiss, store],
  );

  const items = useMemo<SheetItem[]>(() => {
    const base: SheetItem[] = [
      {
        Icon: Camera,
        id: 'take-photo',
        label: t('Take Photo'),
        onPress: () => {
          onSelect('camera');
        },
        testID: 'channel-edit-picture-take-photo',
      },
      {
        Icon: Picture,
        id: 'choose-image',
        label: t('Choose Image'),
        onPress: () => {
          onSelect('library');
        },
        testID: 'channel-edit-picture-choose-image',
      },
    ];

    if (canReset) {
      base.push({
        destructive: true,
        Icon: Delete,
        id: 'reset-picture',
        label: t('Reset Picture'),
        onPress: () => {
          onSelect('reset');
        },
        testID: 'channel-edit-picture-reset',
      });
    }

    return base;
  }, [canReset, onSelect, t]);

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

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelEditImageSheet = ({ onClose, visible }: ChannelEditImageSheetProps) => (
  <BottomSheetModal enableDynamicSizing onClose={onClose} visible={visible}>
    <ChannelEditImageSheetInner />
  </BottomSheetModal>
);

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
