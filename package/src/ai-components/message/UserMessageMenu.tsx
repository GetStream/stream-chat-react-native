import React, { type ComponentType, type ReactNode } from 'react';
import {
  I18nManager,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { useTheme } from '../contexts';
import { primitives } from '../internal/tokens';

/** Where the pressed bubble is on the screen, as `measureInWindow` says. */
export type UserMessageMenuAnchor = { height: number; width: number; x: number; y: number };

export type UserMessageMenuItem = {
  Icon: ComponentType<{ color?: string; size?: number }>;
  label: string;
  onPress: () => void;
};

type UserMessageMenuProps = {
  anchor: UserMessageMenuAnchor | undefined;
  /** The bubble again, drawn lifted over the dimmed screen on iOS. */
  bubble: ReactNode;
  items: UserMessageMenuItem[];
  onClose: () => void;
};

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 44;
const GAP = primitives.spacingXs;

const MENU_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: { easing: Easing.out(Easing.ease), opacity: 1, transform: [{ scale: 1 }] },
}).duration(150);

/**
 * The menu a long press on the person's message opens, under the bubble or above it when there is
 * no room, at its trailing edge. On iOS the screen dims behind the lifted bubble, as a context menu
 * does; on Android it drops down from the bubble, as the Android AI SDK's does.
 */
export const UserMessageMenu = ({ anchor, bubble, items, onClose }: UserMessageMenuProps) => {
  const {
    theme: { colors, message },
  } = useTheme();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const styles = message?.userMessage;
  if (!anchor) return null;

  const menuHeight = items.length * ITEM_HEIGHT;
  const fitsBelow = anchor.y + anchor.height + GAP + menuHeight <= screenHeight - GAP;
  const top = fitsBelow
    ? anchor.y + anchor.height + GAP
    : Math.max(GAP, anchor.y - GAP - menuHeight);
  // The bubble's trailing edge: its right in a left-to-right layout, its left otherwise.
  const left = I18nManager.isRTL
    ? Math.min(anchor.x, screenWidth - MENU_WIDTH - GAP)
    : Math.max(GAP, anchor.x + anchor.width - MENU_WIDTH);
  const lifts = Platform.OS === 'ios';

  return (
    <Modal animationType='fade' onRequestClose={onClose} statusBarTranslucent transparent visible>
      <Pressable
        accessibilityRole='button'
        onPress={onClose}
        style={[StyleSheet.absoluteFill, lifts && defaultStyles.dim]}
      />
      {lifts ? (
        <View
          pointerEvents='none'
          style={[defaultStyles.lifted, { left: anchor.x, top: anchor.y, width: anchor.width }]}
        >
          {bubble}
        </View>
      ) : null}
      <Animated.View
        accessibilityRole='menu'
        entering={MENU_IN}
        style={[
          defaultStyles.menu,
          { backgroundColor: colors.white, left, top, width: MENU_WIDTH },
          styles?.menu,
        ]}
      >
        {items.map(({ Icon, label, onPress }) => (
          <Pressable
            accessibilityRole='button'
            key={label}
            onPress={() => {
              onClose();
              onPress();
            }}
            style={({ pressed }) => [
              defaultStyles.item,
              pressed && { backgroundColor: colors.white_smoke },
              styles?.menuItem,
            ]}
          >
            <Icon color={MENU_TEXT} size={20} />
            <Text style={[defaultStyles.itemText, styles?.menuItemText]}>{label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
};

// The design tokens' primary text.
const MENU_TEXT = '#1A1B25';

const defaultStyles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: primitives.spacingXs + 4,
    height: ITEM_HEIGHT,
    paddingHorizontal: primitives.spacingMd,
  },
  itemText: {
    color: MENU_TEXT,
    fontSize: primitives.typographyFontSizeMd,
  },
  lifted: {
    alignItems: 'flex-end',
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    transform: [{ scale: 1.02 }],
  },
  menu: {
    borderRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
