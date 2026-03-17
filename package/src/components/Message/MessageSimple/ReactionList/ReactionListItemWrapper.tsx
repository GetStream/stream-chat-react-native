import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';

export type ReactionListItemWrapperProps = PressableProps & {
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
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: selected
              ? semantics.backgroundUtilitySelected
              : pressed
                ? semantics.backgroundUtilityPressed
                : semantics.reactionBg,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        reactionListItemWrapper: { wrapper, container },
      },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: primitives.radiusMax,
        borderColor: semantics.reactionBorder,

        paddingVertical: primitives.spacingXxs,
        paddingHorizontal: primitives.spacingXs,
        gap: primitives.spacingXxs,
        ...container,
      },
      wrapper: {
        backgroundColor: semantics.reactionBg,
        borderRadius: primitives.radiusMax,
        ...wrapper,
      },
    });
  }, [semantics, wrapper, container]);
};
