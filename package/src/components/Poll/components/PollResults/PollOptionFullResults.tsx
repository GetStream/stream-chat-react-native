import React, { useCallback, useMemo } from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollVote } from './PollVote';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';

import { primitives } from '../../../../theme';
import { usePollOptionVotesPagination } from '../../hooks/usePollOptionVotesPagination';
import { usePollState } from '../../hooks/usePollState';

export type PollOptionFullResultsProps = PollContextValue & {
  option: PollOption;
  additionalFlatListProps?: Partial<FlatListProps<PollVoteClass>>;
  PollOptionFullResultsContent?: React.ComponentType<{ option: PollOption }>;
};

export const renderPollOptionFullResultsItem = ({ item }: { item: PollVoteClass }) => (
  <PollVote vote={item} />
);

export const PollOptionFullResultsContent = ({
  additionalFlatListProps,
  option,
}: Pick<PollOptionFullResultsProps, 'option' | 'additionalFlatListProps'>) => {
  const { t } = useTranslationContext();
  const { hasNextPage, loadMore, votes } = usePollOptionVotesPagination({ option });
  const { voteCountsByOption } = usePollState();

  const {
    theme: {
      poll: {
        fullResults: { container, contentContainer, headerContainer, headerText, headerTitle },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const PollOptionFullResultsHeader = useCallback(
    () => (
      <View style={[styles.headerContainer, headerContainer]}>
        <Text style={[styles.headerTitle, headerTitle]}>{option.text}</Text>
        <Text style={[styles.headerText, headerText]}>
          {t('{{count}} votes', { count: voteCountsByOption[option.id] ?? 0 })}
        </Text>
      </View>
    ),
    [
      headerContainer,
      headerText,
      headerTitle,
      option.id,
      option.text,
      styles.headerContainer,
      styles.headerText,
      styles.headerTitle,
      t,
      voteCountsByOption,
    ],
  );

  return (
    <View style={[styles.container, container]}>
      <FlatList
        contentContainerStyle={[styles.contentContainer, contentContainer]}
        data={votes}
        keyExtractor={(item) => `option_full_results_${item.id}`}
        ListHeaderComponent={PollOptionFullResultsHeader}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={renderPollOptionFullResultsItem}
        {...additionalFlatListProps}
      />
    </View>
  );
};

export const PollOptionFullResults = ({
  additionalFlatListProps,
  message,
  option,
  poll,
  PollOptionFullResultsContent: PollOptionFullResultsContentOverride,
}: PollOptionFullResultsProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollOptionFullResultsContentOverride ? (
      <PollOptionFullResultsContentOverride option={option} />
    ) : (
      <PollOptionFullResultsContent
        additionalFlatListProps={additionalFlatListProps}
        option={option}
      />
    )}
  </PollContextProvider>
);

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: semantics.backgroundCoreElevation1 },
      contentContainer: {
        margin: primitives.spacingMd,
        backgroundColor: semantics.backgroundCoreSurfaceCard,
        borderRadius: primitives.radiusLg,
        paddingHorizontal: primitives.spacingMd,
        paddingTop: primitives.spacingMd,
        paddingBottom: primitives.spacingXs,
      },
      headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: primitives.spacingXs,
      },
      headerTitle: {
        flex: 1,
        fontSize: primitives.typographyFontSizeLg,
        lineHeight: primitives.typographyLineHeightRelaxed,
        fontWeight: primitives.typographyFontWeightSemiBold,
        color: semantics.textPrimary,
        paddingTop: primitives.spacingXs,
        textAlign: 'left',
      },
      headerText: {
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightSemiBold,
        color: semantics.textPrimary,
        paddingTop: primitives.spacingXs,
        marginStart: primitives.spacingMd,
        textAlign: 'left',
      },
    });
  }, [
    semantics.backgroundCoreElevation1,
    semantics.backgroundCoreSurfaceCard,
    semantics.textPrimary,
  ]);
};
