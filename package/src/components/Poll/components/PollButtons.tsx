import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GenericPollButton, PollButtonProps } from './Button';
import { PollAnswersList } from './PollAnswersList';
import { PollInputDialog } from './PollInputDialog';
import { PollModalHeader } from './PollModalHeader';
import { PollAllOptions } from './PollOption';
import { PollResults } from './PollResults';

import { useChatContext, usePollContext, useTheme, useTranslationContext } from '../../../contexts';
import { primitives } from '../../../theme';
import { defaultPollOptionCount } from '../../../utils/constants';
import { SafeAreaViewWrapper } from '../../UIComponents/SafeAreaViewWrapper';
import { useIsPollCreatedByCurrentUser } from '../hook/useIsPollCreatedByCurrentUser';
import { usePollState } from '../hooks/usePollState';

export const ViewResultsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const [showResults, setShowResults] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowResults(true);
  }, [message, onPress, poll]);

  const styles = useStyles();

  const onRequestClose = useCallback(() => {
    setShowResults(false);
  }, []);

  return (
    <>
      <GenericPollButton
        label={t('View Results')}
        onPress={onPressHandler}
        style={styles.viewResultsButton}
        type='outline'
      />
      {showResults ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showResults}>
          <GestureHandlerRootView style={styles.modalRoot}>
            <SafeAreaViewWrapper style={styles.safeArea}>
              <PollModalHeader onPress={onRequestClose} title={t('Poll Results')} />
              <PollResults message={message} poll={poll} />
            </SafeAreaViewWrapper>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
};

export const ShowAllOptionsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const [showAllOptions, setShowAllOptions] = useState(false);
  const { message, poll } = usePollContext();
  const { options } = usePollState();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAllOptions(true);
  }, [message, onPress, poll]);

  const onRequestClose = useCallback(() => {
    setShowAllOptions(false);
  }, []);

  const styles = useStyles();

  return (
    <>
      {options && options.length > defaultPollOptionCount ? (
        <GenericPollButton
          onPress={onPressHandler}
          label={t('+{{count}} More Options', { count: options.length - defaultPollOptionCount })}
        />
      ) : null}
      {showAllOptions ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showAllOptions}>
          <GestureHandlerRootView style={styles.modalRoot}>
            <SafeAreaViewWrapper style={styles.safeArea}>
              <PollModalHeader onPress={onRequestClose} title={t('Poll Options')} />
              <PollAllOptions message={message} poll={poll} />
            </SafeAreaViewWrapper>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
};

export const ShowAllCommentsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { answersCount } = usePollState();
  const [showAnswers, setShowAnswers] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAnswers(true);
  }, [message, onPress, poll]);

  const styles = useStyles();

  const onRequestClose = useCallback(() => {
    setShowAnswers(false);
  }, []);

  return (
    <>
      {answersCount && answersCount > 0 ? (
        <GenericPollButton
          onPress={onPressHandler}
          label={t('View {{count}} comments', { count: answersCount })}
        />
      ) : null}
      {showAnswers ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showAnswers}>
          <GestureHandlerRootView style={styles.modalRoot}>
            <SafeAreaViewWrapper style={styles.safeArea}>
              <PollModalHeader onPress={onRequestClose} title={t('Poll Comments')} />
              <PollAnswersList message={message} poll={poll} />
            </SafeAreaViewWrapper>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addOption, allowUserSuggestedOptions, isClosed } = usePollState();
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddOptionDialog(true);
  }, [message, onPress, poll]);

  const onRequestClose = useCallback(() => {
    setShowAddOptionDialog(false);
  }, []);

  return (
    <>
      {!isClosed && allowUserSuggestedOptions ? (
        <GenericPollButton onPress={onPressHandler} label={t('Suggest an option')} />
      ) : null}
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={onRequestClose}
          onSubmit={addOption}
          title={t('Suggest an option')}
          visible={showAddOptionDialog}
        />
      ) : null}
    </>
  );
};

export const AddCommentButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addComment, allowAnswers, isClosed, ownAnswer } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  const onRequestClose = useCallback(() => {
    setShowAddCommentDialog(false);
  }, []);

  return (
    <>
      {!isClosed && allowAnswers ? (
        <GenericPollButton onPress={onPressHandler} label={t('Add a comment')} />
      ) : null}
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={onRequestClose}
          initialValue={ownAnswer?.answer_text ?? ''}
          onSubmit={addComment}
          title={t('Add a comment')}
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const EndVoteButton = () => {
  const { t } = useTranslationContext();
  const { createdBy, endVote, isClosed } = usePollState();
  const { client } = useChatContext();
  const styles = useStyles();

  return !isClosed && createdBy?.id === client.userID ? (
    <GenericPollButton
      label={t('End Vote')}
      onPress={endVote}
      style={styles.endVoteButton}
      type='outline'
    />
  ) : null;
};

export const PollButtons = () => {
  const styles = useStyles();
  return (
    <View style={styles.buttonsContainer}>
      <ViewResultsButton />
      <EndVoteButton />
      <SuggestOptionButton />
      <AddCommentButton />
      <ShowAllCommentsButton />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const isPollCreatedByClient = useIsPollCreatedByCurrentUser();
  return useMemo(() => {
    return StyleSheet.create({
      buttonsContainer: { gap: primitives.spacingXs },
      modalRoot: {
        flex: 1,
      },
      endVoteButton: {
        borderColor: isPollCreatedByClient
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
      viewResultsButton: {
        borderColor: isPollCreatedByClient
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
      safeArea: {
        backgroundColor: semantics.backgroundCoreElevation1,
        flex: 1,
      },
    });
  }, [semantics, isPollCreatedByClient]);
};
