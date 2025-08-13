import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, type FlatListProps, Pressable, StyleSheet, Text, View } from 'react-native';

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
import { getDateString } from '../../../utils/i18n/getDateString';
import { Avatar } from '../../Avatar/Avatar';
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

  const {
    theme: {
      colors: { accent_dark_blue, bg_user },
      poll: {
        answersList: { buttonContainer },
        button: { text },
      },
    },
  } = useTheme();

  return (
    <>
      <Pressable
        onPress={onPressHandler}
        style={({ pressed }) => [
          { opacity: pressed ? 0.5 : 1 },
          styles.addCommentButtonContainer,
          { backgroundColor: bg_user },
          buttonContainer,
        ]}
      >
        <Text style={[styles.addCommentButtonText, { color: accent_dark_blue }, text]}>
          {ownAnswer ? t('Update your comment') : t('Add a comment')}
        </Text>
      </Pressable>
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
      colors: { bg_user, black },
      poll: {
        answersList: { item: itemStyle },
      },
    },
  } = useTheme();

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
    <View style={[styles.listItemContainer, { backgroundColor: bg_user }, itemStyle.container]}>
      <Text style={[styles.listItemAnswerText, { color: black }, itemStyle.answerText]}>
        {answer.answer_text}
      </Text>
      <View style={[styles.listItemInfoContainer, itemStyle.infoContainer]}>
        <View style={[styles.listItemUserInfoContainer, itemStyle.userInfoContainer]}>
          {!isAnonymous && answer.user?.image ? (
            <Avatar image={answer.user?.image as string} size={20} />
          ) : null}
          <Text style={{ color: black, fontSize: 14, marginLeft: 2 }}>
            {isAnonymous ? t('Anonymous') : answer.user?.name}
          </Text>
        </View>
        <Text style={{ color: black }}>{dateString}</Text>
      </View>
    </View>
  );
};

const PollAnswerListItemComponent = ({ item }: { item: PollAnswer }) => (
  <PollAnswerListItem answer={item} />
);

export const PollAnswersListContent = ({
  additionalFlatListProps,
}: Pick<PollAnswersListProps, 'additionalFlatListProps'>) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const {
    theme: {
      colors: { white },
      poll: {
        answersList: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: white }, container]}>
      <FlatList
        data={pollAnswers}
        keyExtractor={(item) => `poll_answer_${item.id}`}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={PollAnswerListItemComponent}
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

const styles = StyleSheet.create({
  addCommentButtonContainer: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  addCommentButtonText: { fontSize: 16 },
  container: { flex: 1, margin: 16 },
  listItemAnswerText: { fontSize: 16, fontWeight: '500' },
  listItemContainer: {
    borderRadius: 12,
    marginBottom: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listItemInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  listItemUserInfoContainer: { alignItems: 'center', flexDirection: 'row' },
});
