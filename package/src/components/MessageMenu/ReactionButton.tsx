import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons';
import { Button, ButtonProps } from '../ui';

export type ReactionButtonProps = {
  /** Icon of the reaction. */
  Icon: React.ComponentType<IconProps>;
  /** Whether the button is selected. */
  selected: boolean;
  /** The reaction type, passed to `onPress`. */
  type: string;
  /**
   * Called when the button is pressed.
   *
   * @param reactionType The `type` of the pressed button.
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
