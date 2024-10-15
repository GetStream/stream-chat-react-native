import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons';

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
      colors: { light_blue, white },
      messageMenu: {
        reactionButton: { filledColor, unfilledColor },
        reactionPicker: { buttonContainer, reactionIconSize },
      },
    },
  } = useTheme();

  const onPressHandler = () => {
    if (onPress) {
      onPress(type);
    }
  };

  return (
    <Pressable
      accessibilityLabel={`reaction-button-${type}-${selected ? 'selected' : 'unselected'}`}
      onPress={onPressHandler}
      style={({ pressed }) => [
        styles.reactionButton,
        { backgroundColor: pressed || selected ? light_blue : white },
        buttonContainer,
      ]}
    >
      <Icon
        height={reactionIconSize}
        pathFill={selected ? filledColor : unfilledColor}
        width={reactionIconSize}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  reactionButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    padding: 8,
  },
});
