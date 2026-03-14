import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import Animated, { LinearTransition, StretchInY, StretchOutY } from 'react-native-reanimated';

import { PollComposerState } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStableCallback } from '../../../hooks';
import { useStateStore } from '../../../hooks/useStateStore';
import { Minus, Plus } from '../../../icons';
import { primitives } from '../../../theme';
import { Button } from '../../ui';

const pollComposerStateSelector = (state: PollComposerState) => ({
  max_votes_allowed: state.data.max_votes_allowed,
});

const MaxVotesTextInput = () => {
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { handleFieldBlur, updateFields } = pollComposer;
  const { max_votes_allowed } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const {
    theme: {
      poll: {
        createContent: { multipleAnswers },
      },
    },
  } = useTheme();
  const hasSelectedInitialValueRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const styles = useStyles();

  const onChangeTextHandler = useCallback(
    async (newText: string) => {
      await updateFields({ max_votes_allowed: newText });
    },
    [updateFields],
  );

  const onBlurHandler = useCallback(async () => {
    await handleFieldBlur('max_votes_allowed');
  }, [handleFieldBlur]);

  useEffect(() => {
    if (hasSelectedInitialValueRef.current || max_votes_allowed.length === 0) {
      return;
    }

    hasSelectedInitialValueRef.current = true;

    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus();

      if (Platform.OS !== 'ios') {
        return;
      }

      requestAnimationFrame(() => {
        inputRef.current?.setNativeProps({
          selection: {
            end: max_votes_allowed.length,
            start: 0,
          },
        });
      });
    });

    return () => {
      cancelAnimationFrame(focusFrame);
    };
  }, [max_votes_allowed.length]);

  return (
    <TextInput
      autoFocus
      inputMode='numeric'
      onBlur={onBlurHandler}
      onChangeText={onChangeTextHandler}
      ref={inputRef}
      selectTextOnFocus
      style={[styles.input, multipleAnswers.input]}
      value={max_votes_allowed}
    />
  );
};

export const MultipleVotesSettings = () => {
  const [allowMaxVotesPerPerson, setAllowMaxVotesPerPerson] = useState<boolean>(false);
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { updateFields } = pollComposer;
  const { max_votes_allowed } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const {
    theme: {
      poll: {
        createContent: { multipleAnswers },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const decrementDisabled = Number(max_votes_allowed) <= 2;
  const incrementDisabled = Number(max_votes_allowed) >= 10;

  const decrementMaxVotes = useStableCallback(async () => {
    const numericValue = Number(pollComposer.state.getLatestValue().data.max_votes_allowed.trim());
    if (Number.isInteger(numericValue)) {
      await updateFields({ max_votes_allowed: String(numericValue - 1) });
    }
  });

  const incrementMaxVotes = useStableCallback(async () => {
    const numericValue = Number(pollComposer.state.getLatestValue().data.max_votes_allowed.trim());
    if (Number.isInteger(numericValue)) {
      await updateFields({ max_votes_allowed: String(numericValue + 1) });
    }
  });

  const onMaxVotesPerPersonHandler = useStableCallback(async (value: boolean) => {
    const currentValue = pollComposer.state.getLatestValue().data.max_votes_allowed;
    setAllowMaxVotesPerPerson(value);
    await updateFields({
      max_votes_allowed: value ? (currentValue === '' ? '2' : currentValue) : '',
    });
  });

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      entering={StretchInY.duration(200)}
      exiting={StretchOutY.duration(200)}
      style={[styles.settingsWrapper, multipleAnswers.settingsWrapper]}
    >
      <View style={[styles.optionCard, multipleAnswers.optionCard]}>
        <View style={[styles.optionCardContent, multipleAnswers.optionCardContent]}>
          <Text style={[styles.title, multipleAnswers.title]}>{t('Limit votes per person')}</Text>
          <Text style={[styles.description, multipleAnswers.description]}>
            {t('Choose between 2–10 options')}
          </Text>
        </View>
        <Switch
          onValueChange={onMaxVotesPerPersonHandler}
          value={allowMaxVotesPerPerson}
          style={[styles.optionCardSwitch, multipleAnswers.optionCardSwitch]}
        />
      </View>
      {allowMaxVotesPerPerson ? (
        <Animated.View
          entering={StretchInY.duration(200)}
          exiting={StretchOutY.duration(200)}
          style={[styles.row, multipleAnswers.row]}
        >
          <Button
            variant='secondary'
            type='outline'
            size='md'
            iconOnly
            LeadingIcon={Minus}
            onPress={decrementMaxVotes}
            disabled={decrementDisabled}
            testID='max-votes-decrement'
          />
          <MaxVotesTextInput />
          <Button
            variant='secondary'
            type='outline'
            size='md'
            iconOnly
            LeadingIcon={Plus}
            onPress={incrementMaxVotes}
            disabled={incrementDisabled}
            testID='max-votes-increment'
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
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
      optionCardSwitch: { width: 64 },
      settingsWrapper: {
        gap: primitives.spacingMd,
      },
      row: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      input: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        paddingHorizontal: primitives.spacingSm,
        paddingVertical: primitives.spacingMd,
      },
    });
  }, [semantics]);
};
