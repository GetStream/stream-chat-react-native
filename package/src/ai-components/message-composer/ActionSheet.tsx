// BottomSheetContent.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  AIMessageComposerProps,
  BottomSheetOption,
} from './MessageComposer.tsx';
import { setHeight } from '../store/bottom-sheet-state-store.ts';
import { Camera } from '../internal/icons/Camera.tsx';
import { Picture } from '../internal/icons/Picture.tsx';
import { Folder } from '../internal/icons/Folder.tsx';
import type { AbstractMediaPickerService } from '../services/media-picker-service/AbstractMediaPickerService';
import { withCloseSheet } from './utils/withCloseSheet.ts';

type BottomSheetContentProps = Pick<
  AIMessageComposerProps,
  'bottomSheetInsets' | 'bottomSheetOptions'
> & { mediaPickerService?: AbstractMediaPickerService };

export const BottomSheetContent = ({
  bottomSheetInsets,
  bottomSheetOptions,
  mediaPickerService,
}: BottomSheetContentProps) => {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: 16 + (bottomSheetInsets?.bottom ?? 0) },
      ]}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={(_, height) => setHeight(height)}
    >
      <View style={styles.quickActionsCard}>
        <QuickActionButton
          label={'Camera'}
          Icon={Camera}
          onPress={withCloseSheet(() => mediaPickerService?.takeMedia({}))}
        />
        <QuickActionButton
          label={'Photos'}
          Icon={Picture}
          onPress={withCloseSheet(() => mediaPickerService?.pickMedia({}))}
        />
        <QuickActionButton label={'Files'} Icon={Folder} />
      </View>

      {bottomSheetOptions.length > 0 ? (
        <>
          <View style={styles.divider} />
          <View style={styles.listSection}>
            {bottomSheetOptions.map((option, index) => (
              <ListItem key={index} option={option} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
};

type QuickActionButtonProps = {
  label: string;
  Icon: React.ComponentType;
  onPress?: () => void;
};

export const QuickActionButton = ({
  label,
  Icon,
  onPress,
}: QuickActionButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.quickAction,
      pressed && styles.quickActionPressed,
    ]}
  >
    <Icon />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </Pressable>
);

export type ListItemProps = {
  option: BottomSheetOption;
};

export const ListItem = ({ option }: ListItemProps) => {
  const { title, subtitle, action, Icon } = option;
  return (
    <Pressable
      onPress={withCloseSheet(action)}
      style={({ pressed }) => [
        styles.listItem,
        pressed && styles.listItemPressed,
      ]}
    >
      {Icon ? (
        <View style={styles.listIcon}>
          <Icon />
        </View>
      ) : null}

      <View style={styles.listTextContainer}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quickActionsCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 18,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 4,
    backgroundColor: '#F4F4F6',
  },
  quickActionPressed: {
    opacity: 0.7,
  },
  quickActionIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
    marginTop: 4,
  },
  listSection: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  listItemPressed: {
    opacity: 0.7,
  },
  listIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 2,
  },
  listTextContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111111',
  },
  listSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6C6C70',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginTop: 10,
  },
});
