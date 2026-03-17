import React, { useMemo } from 'react';
import { ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollResultsItem } from './PollResultItem';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';
import { primitives } from '../../../../theme';
import { usePollState } from '../../hooks/usePollState';

export type PollResultsProps = PollContextValue & {
  additionalScrollViewProps?: Partial<ScrollViewProps>;
  PollResultsContent?: React.ComponentType;
};

export const PollResultsContent = ({
  additionalScrollViewProps,
}: Pick<PollResultsProps, 'additionalScrollViewProps'>) => {
  const { name, options, voteCountsByOption } = usePollState();

  const sortedOptions = useMemo(
    () =>
      [...options].sort(
        (a, b) => (voteCountsByOption[b.id] ?? 0) - (voteCountsByOption[a.id] ?? 0),
      ),
    [voteCountsByOption, options],
  );

  const { t } = useTranslationContext();

  const {
    theme: {
      poll: {
        results: { container, scrollView, title, titleMeta },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <ScrollView style={[styles.scrollView, scrollView]} {...additionalScrollViewProps}>
      <View style={[styles.container, container]}>
        <Text style={[styles.titleMeta, titleMeta]}>{t('Question')}</Text>
        <Text style={[styles.title, title]}>{name}</Text>
      </View>
      <View style={styles.resultsContainer}>
        {sortedOptions.map((option, index) => (
          <PollResultsItem key={`results_${option.id}`} option={option} index={index} />
        ))}
      </View>
    </ScrollView>
  );
};

export const PollResults = ({
  additionalScrollViewProps,
  message,
  poll,
  PollResultsContent: PollResultsContentOverride,
}: PollResultsProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollResultsContentOverride ? (
      <PollResultsContentOverride />
    ) : (
      <PollResultsContent additionalScrollViewProps={additionalScrollViewProps} />
    )}
  </PollContextProvider>
);

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: primitives.radiusLg,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreSurfaceCard,
        },
        scrollView: {
          flex: 1,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        resultsContainer: {
          paddingVertical: primitives.spacing2xl,
        },
        title: {
          fontSize: primitives.typographyFontSizeLg,
          lineHeight: primitives.typographyLineHeightRelaxed,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          paddingTop: primitives.spacingXs,
        },
        titleMeta: {
          fontSize: primitives.typographyFontSizeSm,
          color: semantics.textTertiary,
          lineHeight: primitives.typographyLineHeightNormal,
          fontWeight: primitives.typographyFontWeightMedium,
        },
      }),
    [semantics],
  );
};
