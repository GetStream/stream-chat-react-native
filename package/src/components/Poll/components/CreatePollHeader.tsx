import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { IconProps } from '../../../icons';
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
  const { icons } = useComponentsContext();

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
      return (
        <icons.Check
          {...props}
          height={18}
          stroke={canCreatePoll ? semantics.textOnAccent : semantics.textDisabled}
          width={18}
        />
      );
    },
    [canCreatePoll, icons, semantics.textOnAccent, semantics.textDisabled],
  );

  return (
    <View style={[styles.headerContainer, headerContainer]}>
      <Button
        accessibilityLabelKey='poll.createPoll.close.accessibilityLabel'
        variant='secondary'
        onPress={onBackPressHandler}
        type='outline'
        size='md'
        LeadingIcon={icons.Cross}
        iconOnly
      />

      <Text numberOfLines={1} style={[styles.title, titleStyle]}>
        {t('attachmentPicker.poll.label', 'Create Poll')}
      </Text>

      <Button
        accessibilityLabelKey='poll.createPoll.submit.accessibilityLabel'
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
