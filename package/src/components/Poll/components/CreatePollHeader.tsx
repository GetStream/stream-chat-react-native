import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Check, IconProps } from '../../../icons';
import { Cross } from '../../../icons/Cross';
import { primitives } from '../../../theme';
import { Button } from '../../ui';
import { useCanCreatePoll } from '../hooks/useCanCreatePoll';

export type CreatePollHeaderProps = {
  /**
   * Handler for back button press
   * @returns void
   */
  onBackPressHandler: () => void;
  /**
   * Handler for create poll button press
   * @returns void
   */
  onCreatePollPressHandler: () => void;
};

export const CreatePollHeader = ({
  onBackPressHandler,
  onCreatePollPressHandler,
}: CreatePollHeaderProps) => {
  const { t } = useTranslationContext();

  const canCreatePoll = useCanCreatePoll();

  const {
    theme: {
      poll: {
        createContent: { headerContainer, sendButton },
        modalHeader: { title: titleStyle },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const renderSendPollIcon = useCallback(
    (props: IconProps) => {
      return <Check {...props} height={18} stroke={semantics.textOnAccent} width={18} />;
    },
    [semantics.textOnAccent],
  );

  return (
    <View style={[styles.headerContainer, headerContainer]}>
      <Button
        variant='secondary'
        onPress={onBackPressHandler}
        type='solid'
        LeadingIcon={Cross}
        iconOnly
      />

      <Text numberOfLines={1} style={[styles.title, titleStyle]}>
        {t('Create Poll')}
      </Text>

      <Button
        variant='primary'
        onPress={onCreatePollPressHandler}
        type='solid'
        LeadingIcon={renderSendPollIcon}
        iconOnly
        disabled={!canCreatePoll}
        style={sendButton}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: primitives.spacingMd,
        backgroundColor: semantics.backgroundCoreElevation1,
      },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
    });
  }, [semantics]);
};
