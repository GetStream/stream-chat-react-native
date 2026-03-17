import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { MultipleVotesSettings } from './MultipleVotesSettings';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { primitives } from '../../../theme';

export const MultipleAnswersField = () => {
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false);
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { updateFields } = pollComposer;

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

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[styles.multipleAnswersWrapper, multipleAnswers.wrapper]}
    >
      <View style={[styles.optionCard, multipleAnswers.optionCard]}>
        <View style={[styles.optionCardContent, multipleAnswers.optionCardContent]}>
          <Text style={[styles.title, multipleAnswers.title]}>{t('Multiple votes')}</Text>
          <Text style={[styles.description, multipleAnswers.description]}>
            {t('Select more than one option')}
          </Text>
        </View>
        <Switch
          onValueChange={onEnforceUniqueVoteHandler}
          value={allowMultipleVotes}
          style={[styles.optionCardSwitch, multipleAnswers.optionCardSwitch]}
        />
      </View>
      {allowMultipleVotes ? <MultipleVotesSettings /> : null}
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      multipleAnswersWrapper: {
        backgroundColor: semantics.backgroundCoreSurfaceCard,
        padding: primitives.spacingMd,
        borderRadius: primitives.radiusLg,
        gap: primitives.spacingMd,
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
      optionCardSwitch: { width: 64 },
    });
  }, [semantics]);
};
