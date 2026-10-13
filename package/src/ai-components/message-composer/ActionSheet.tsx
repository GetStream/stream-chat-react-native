import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomSheetOption, ComposerViewProps } from './ComposerView';
import { sheetStoreApi } from '../store';
import { Camera } from '../internal/icons/Camera';
import { Picture } from '../internal/icons/Picture';
import { withCloseSheet } from './utils/withCloseSheet';
import { useMessageComposerContext, useTheme } from '../contexts';

type BottomSheetContentProps = Pick<
  ComposerViewProps,
  'bottomSheetOptions' | 'bottomSheetInsets'
>;

export const BottomSheetContent = ({
  bottomSheetOptions,
  bottomSheetInsets,
}: BottomSheetContentProps) => {
  const {
    theme: {
      sheet: { contentContainer, quickActionsCard, divider, listSection },
    },
  } = useTheme();
  const styles = useStyles();

  const { mediaPickerService } = useMessageComposerContext();

  const onContentSizeChange = useCallback(
    (_: unknown, height: number) => sheetStoreApi.setHeight(height),
    [],
  );

  const insetStyle = useMemo(
    () => ({ paddingBottom: 16 + (bottomSheetInsets?.bottom ?? 0) }),
    [bottomSheetInsets],
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        insetStyle,
        contentContainer,
      ]}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={onContentSizeChange}
    >
      <View style={[styles.quickActionsCard, quickActionsCard]}>
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
      </View>

      {bottomSheetOptions && bottomSheetOptions.length > 0 ? (
        <>
          <View style={[styles.divider, divider]} />
          <View style={[styles.listSection, listSection]}>
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
}: QuickActionButtonProps) => {
  const {
    theme: {
      sheet: { quickAction, quickActionLabel },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        quickAction,
        pressed && styles.pressedView,
      ]}
    >
      <Icon />
      <Text style={[styles.quickActionLabel, quickActionLabel]}>{label}</Text>
    </Pressable>
  );
};

export type ListItemProps = {
  option: BottomSheetOption;
};

export const ListItem = ({ option }: ListItemProps) => {
  const {
    theme: {
      sheet: { listItem, listIcon, listTextContainer, listTitle, listSubtitle },
    },
  } = useTheme();
  const styles = useStyles();

  const { title, subtitle, action, Icon } = option;

  return (
    <Pressable
      onPress={withCloseSheet(action)}
      style={({ pressed }) => [
        styles.listItem,
        listItem,
        pressed && styles.pressedView,
      ]}
    >
      {Icon ? (
        <View style={[styles.listIcon, listIcon]}>
          <Icon />
        </View>
      ) : null}

      <View style={[styles.listTextContainer, listTextContainer]}>
        <Text style={[styles.listTitle, listTitle]}>{title}</Text>
        <Text style={[styles.listSubtitle, listSubtitle]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    const { colors } = theme;

    return StyleSheet.create({
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
        backgroundColor: colors.white_smoke,
      },
      pressedView: {
        opacity: 0.7,
      },
      quickActionLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.black,
        marginTop: 4,
      },
      listSection: {
        marginTop: 4,
        borderRadius: 18,
        backgroundColor: colors.white,
        paddingHorizontal: 12,
        paddingVertical: 4,
      },
      listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
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
        color: colors.black,
      },
      listSubtitle: {
        marginTop: 2,
        fontSize: 13,
        color: colors.grey_dark,
      },
      divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.grey_whisper,
        marginTop: 10,
      },
    });
  }, [theme]);
};
