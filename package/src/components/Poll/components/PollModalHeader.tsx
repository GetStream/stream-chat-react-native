import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts';
import { Cross } from '../../../icons/Cross';
import { primitives } from '../../../theme';
import { Button } from '../../ui';

export type PollModalHeaderProps = {
  onPress: () => void;
  title: string;
};

export const PollModalHeader = ({ onPress, title }: PollModalHeaderProps) => {
  const {
    theme: {
      poll: {
        modalHeader: { container, title: titleStyle },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <View style={styles.sideContainer}>
        <Button
          variant='secondary'
          type='solid'
          size='md'
          iconOnly
          LeadingIcon={Cross}
          onPress={onPress}
          testID='poll-results-close-button'
        />
      </View>
      <View style={styles.centerContainer}>
        <Text numberOfLines={1} style={[styles.title, titleStyle]}>
          {title}
        </Text>
      </View>
      <View style={[styles.sideContainer, styles.sideContainerRight]} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: 10,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        centerContainer: {
          alignItems: 'center',
          flex: 2,
          justifyContent: 'center',
        },
        sideContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        sideContainerRight: {
          alignItems: 'flex-end',
        },
        title: {
          fontSize: 17,
          lineHeight: 22,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
      }),
    [semantics],
  );
};
