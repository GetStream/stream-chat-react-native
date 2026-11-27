import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { IconProps } from '../../icons';
import { components, primitives } from '../../theme';
import { Button } from '../ui';

export type ScheduleSheetHeaderProps = {
  onClose: () => void;
  title: string;
  /** Renders the confirm button when set. */
  onConfirm?: () => void;
  confirmDisabled?: boolean;
};

/** The header of the schedule sheets: close on the start, the title, and an optional confirm. */
export const ScheduleSheetHeader = ({
  confirmDisabled = false,
  onClose,
  onConfirm,
  title,
}: ScheduleSheetHeaderProps) => {
  const { icons } = useComponentsContext();
  const {
    theme: {
      scheduledMessages: { sheetHeader },
      semantics,
    },
  } = useTheme();

  const renderConfirmIcon = useCallback(
    (props: IconProps) => (
      <icons.Check
        {...props}
        height={components.iconSizeMd}
        stroke={confirmDisabled ? semantics.textDisabled : semantics.textOnAccent}
        width={components.iconSizeMd}
      />
    ),
    [confirmDisabled, icons, semantics.textDisabled, semantics.textOnAccent],
  );

  return (
    <View style={[styles.container, sheetHeader.container]}>
      <View style={styles.side}>
        <Button
          accessibilityLabelKey='common.close.accessibilityLabel'
          iconOnly
          LeadingIcon={icons.Cross}
          onPress={onClose}
          size='md'
          testID='schedule-sheet-close'
          type='outline'
          variant='secondary'
        />
      </View>
      <Text
        accessibilityRole='header'
        numberOfLines={1}
        style={[styles.title, { color: semantics.textPrimary }, sheetHeader.title]}
      >
        {title}
      </Text>
      <View style={styles.side}>
        {onConfirm ? (
          <Button
            accessibilityLabelKey='scheduledMessages.confirm.accessibilityLabel'
            disabled={confirmDisabled}
            iconOnly
            LeadingIcon={renderConfirmIcon}
            onPress={onConfirm}
            size='md'
            testID='schedule-sheet-confirm'
            type='solid'
            variant='primary'
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingSm,
    paddingBottom: primitives.spacingSm,
    paddingHorizontal: primitives.spacingSm,
  },
  // A 48 wide hit area for each 40 wide button, as in the design.
  side: {
    alignItems: 'center',
    minWidth: 48,
  },
  title: {
    flex: 1,
    fontSize: primitives.typographyFontSizeMd,
    fontWeight: primitives.typographyFontWeightSemiBold,
    lineHeight: primitives.typographyLineHeightNormal,
    textAlign: 'center',
  },
});
