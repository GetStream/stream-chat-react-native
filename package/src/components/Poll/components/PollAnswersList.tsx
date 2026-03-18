import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollAnswer, VotingVisibility } from 'stream-chat';

import { PollButtonProps } from './Button';
import { PollInputDialog } from './PollInputDialog';

import {
  PollContextProvider,
  PollContextValue,
  usePollContext,
  useTheme,
  useTranslationContext,
} from '../../../contexts';
import { primitives } from '../../../theme';
import { getDateString } from '../../../utils/i18n/getDateString';
import { Button } from '../../ui';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';
import { usePollState } from '../hooks/usePollState';

export const AnswerListAddCommentButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addComment, ownAnswer } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      <Button
        variant={'secondary'}
        type={'outline'}
        size={'lg'}
        label={ownAnswer ? t('Update your comment') : t('Add a comment')}
        onPress={onPressHandler}
      />
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          initialValue={ownAnswer?.answer_text ?? ''}
          onSubmit={addComment}
          title={t('Add a comment')}
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export type PollAnswersListProps = PollContextValue & {
  additionalFlatListProps?: Partial<FlatListProps<PollAnswer>>;
  PollAnswersListContent?: React.ComponentType;
};

export const PollAnswerListItem = ({ answer }: { answer: PollAnswer }) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const { votingVisibility } = usePollState();

  const {
    theme: {
      poll: {
        answersList: { item: itemStyle },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const dateString = useMemo(
    () =>
      getDateString({
        date: answer.updated_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/PollVote',
      }),
    [answer.updated_at, t, tDateTimeParser],
  );

  const isAnonymous = useMemo(
    () => votingVisibility === VotingVisibility.anonymous,
    [votingVisibility],
  );

  return (
    <View style={[styles.listItemContainer, itemStyle.container]}>
      <Text style={[styles.listItemAnswerText, itemStyle.answerText]}>{answer.answer_text}</Text>
      <View style={[styles.listItemInfoContainer, itemStyle.infoContainer]}>
        <View style={[styles.listItemUserInfoContainer, itemStyle.userInfoContainer]}>
          {!isAnonymous && answer.user?.image ? (
            <UserAvatar user={answer.user} size='md' showBorder />
          ) : null}
          <Text style={styles.listItemInfoUserName}>
            {isAnonymous ? t('Anonymous') : answer.user?.name}
          </Text>
        </View>
        <Text style={styles.listItemInfoDate}>{dateString}</Text>
      </View>
    </View>
  );
};

const renderPollAnswerListItem = ({ item }: { item: PollAnswer }) => (
  <PollAnswerListItem answer={item} />
);

export const PollAnswersListContent = ({
  additionalFlatListProps,
}: Pick<PollAnswersListProps, 'additionalFlatListProps'>) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const {
    theme: {
      poll: {
        answersList: { container, contentContainer },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <FlatList
        data={pollAnswers}
        keyExtractor={(item) => `poll_answer_${item.id}`}
        contentContainerStyle={[styles.contentContainer, contentContainer]}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={renderPollAnswerListItem}
        {...additionalFlatListProps}
      />
      <AnswerListAddCommentButton />
    </View>
  );
};

export const PollAnswersList = ({
  additionalFlatListProps,
  message,
  poll,
  PollAnswersListContent: PollAnswersListOverride,
}: PollAnswersListProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollAnswersListOverride ? (
      <PollAnswersListOverride />
    ) : (
      <PollAnswersListContent additionalFlatListProps={additionalFlatListProps} />
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
        addCommentButtonContainer: {
          alignItems: 'center',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 18,
        },
        contentContainer: { gap: primitives.spacingMd },
        addCommentButtonText: { fontSize: 16 },
        container: {
          flex: 1,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        listItemAnswerText: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightRelaxed,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
        listItemContainer: {
          borderRadius: primitives.radiusLg,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreSurfaceCard,
        },
        listItemInfoContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
        },
        listItemInfoUserName: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeSm,
          marginLeft: primitives.spacingXxs,
        },
        listItemInfoDate: {
          fontSize: primitives.typographyFontSizeSm,
          color: semantics.textTertiary,
        },
        listItemUserInfoContainer: { alignItems: 'center', flexDirection: 'row' },
      }),
    [semantics],
  );
};
