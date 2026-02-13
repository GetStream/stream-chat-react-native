import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons';
import { Button } from '../ui';

type ReactionButtonProps = {
  /**
   * Icon to display for the reaction button
   */
  Icon: React.ComponentType<IconProps>;
  /**
   * Whether the reaction button is selected
   */
  selected: boolean;
  /**
   * The type of reaction
   */
  type: string;
  /**
   * Function to call when the reaction button is pressed
   * @param reactionType
   * @returns
   */
  onPress?: (reactionType: string) => void;
};

export const ReactionButton = (props: ReactionButtonProps) => {
  const { Icon, onPress, selected, type } = props;
  const {
    theme: {
      messageMenu: {
        reactionPicker: { reactionIconSize },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const onPressHandler = () => {
    if (onPress) {
      onPress(type);
    }
  };

  const EmojiIcon = useCallback(
    () => <Icon size={reactionIconSize ?? 24} />,
    [Icon, reactionIconSize],
  );

  return (
    <View style={styles.reactionButton}>
      <Button
        variant={'secondary'}
        type={'outline'}
        iconOnly
        size={'md'}
        onPress={onPressHandler}
        selected={selected}
        style={styles.buttonContainer}
        LeadingIcon={EmojiIcon}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      messageMenu: {
        reactionPicker: { buttonContainer },
      },
    },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        reactionButton: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonContainer: {
          ...buttonContainer,
          borderWidth: 0,
        },
      }),
    [buttonContainer],
  );
};
