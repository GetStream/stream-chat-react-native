import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';

type ReactionListItemWrapperProps = PressableProps & {
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ReactionListItemWrapper = (props: ReactionListItemWrapperProps) => {
  const { children, selected = false, style, ...rest } = props;
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected
            ? semantics.backgroundCoreSelected
            : pressed
              ? semantics.backgroundCorePressed
              : semantics.reactionBg,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: primitives.radiusMax,
        borderColor: semantics.reactionBorder,

        paddingVertical: primitives.spacingXxs,
        paddingHorizontal: primitives.spacingXs,
        gap: primitives.spacingXxs,
      },
    });
  }, [semantics]);
};
