import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons';
import { Button, ButtonProps } from '../ui';

export type ReactionButtonProps = {
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
  count?: string;
  size?: ButtonProps['size'];
};

export const ReactionButton = (props: ReactionButtonProps) => {
  const { Icon, onPress, selected, type, size, count } = props;
  const {
    theme: {
      messageMenu: {
        reactionPicker: { reactionIconSize },
      },
    },
  } = useTheme();
  const styles = useStyles(!!count);

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
        accessibilityLabel={`reaction-button-${type}-${selected ? 'selected' : 'unselected'}`}
        variant={'secondary'}
        type={'outline'}
        iconOnly={!count}
        size={size ?? 'md'}
        label={count}
        onPress={onPressHandler}
        selected={selected}
        style={styles.buttonContainer}
        LeadingIcon={EmojiIcon}
      />
    </View>
  );
};

const useStyles = (hasCount: boolean) => {
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
        buttonContainer: hasCount
          ? buttonContainer
          : {
              ...buttonContainer,
              borderWidth: 0,
            },
      }),
    [buttonContainer, hasCount],
  );
};
