import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { PollComposerState } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';
import { primitives } from '../../../theme';
import { Input } from '../../ui/Input/Input';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.max_votes_allowed,
  max_votes_allowed: state.data.max_votes_allowed,
});

export const MultipleAnswersField = () => {
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false);
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { handleFieldBlur, updateFields } = pollComposer;
  const { error, max_votes_allowed } = useStateStore(pollComposer.state, pollComposerStateSelector);

  const {
    theme: {
      poll: {
        createContent: { multipleAnswers },
      },
    },
  } = useTheme();

  const styles = useStyles();

  const onEnforceUniqueVoteHandler = useCallback(
    async (value: boolean) => {
      setAllowMultipleVotes(value);
      await updateFields({ enforce_unique_vote: !value });
    },
    [updateFields],
  );

  const onChangeTextHandler = useCallback(
    async (newText: string) => {
      await updateFields({ max_votes_allowed: newText });
    },
    [updateFields],
  );

  const onBlurHandler = useCallback(async () => {
    await handleFieldBlur('max_votes_allowed');
  }, [handleFieldBlur]);

  return (
    <View style={[styles.multipleAnswersWrapper, multipleAnswers.wrapper]}>
      <View style={[styles.optionCard, multipleAnswers.optionCard]}>
        <View style={[styles.optionCardContent, multipleAnswers.optionCardContent]}>
          <Text style={[styles.title, multipleAnswers.title]}>{t('Multiple answers')}</Text>
          <Text style={[styles.description, multipleAnswers.description]}>
            Select more than one option
          </Text>
        </View>
        <Switch
          onValueChange={onEnforceUniqueVoteHandler}
          value={allowMultipleVotes}
          style={[styles.optionCardSwitch, multipleAnswers.optionCardSwitch]}
        />
      </View>
      {allowMultipleVotes ? (
        <Input
          inputMode='numeric'
          placeholder={t('Maximum votes per person')}
          variant='ghost'
          state={max_votes_allowed && error ? 'error' : 'default'}
          onChangeText={onChangeTextHandler}
          onBlur={onBlurHandler}
          helperText={true}
          infoText={t('Type a number from 2 to 10')}
          errorMessage={error ? t(error) : undefined}
          containerStyle={styles.maxVotesInput}
        />
      ) : null}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      maxVotesInput: {
        paddingLeft: 0,
      },
      multipleAnswersWrapper: {
        backgroundColor: semantics.inputOptionCardBg,
        padding: primitives.spacingMd,
        borderRadius: primitives.radiusLg,
        gap: primitives.spacingSm,
      },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      description: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      optionCardContent: {
        gap: primitives.spacingXxs,
      },
      optionCard: {
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
      },
      optionCardWrapper: {
        gap: primitives.spacingMd,
      },
      optionCardSwitch: {},
    });
  }, [semantics]);
};
