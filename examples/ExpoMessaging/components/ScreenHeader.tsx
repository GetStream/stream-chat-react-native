import React from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useRouter } from 'expo-router';

import { useTheme } from 'stream-chat-expo';

const ChevronLeft = ({ color, size = 20 }: { color: ColorValue; size?: number }) => (
  <Svg fill='none' height={size} viewBox='0 0 24 24' width={size}>
    <Path
      d='M15 18l-6-6 6-6'
      stroke={color as string}
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
    />
  </Svg>
);

const HEADER_CONTENT_HEIGHT = 64;

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  leftContainer: {
    width: 70,
  },
  rightContainer: {
    alignItems: 'flex-end',
    width: 70,
  },
  safeAreaContainer: {
    borderBottomWidth: 1,
  },
  subTitle: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});

type BackButtonProps = {
  onBack?: () => void;
};

const BackButton: React.FC<BackButtonProps> = ({ onBack }) => {
  const router = useRouter();
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <TouchableOpacity
      accessibilityLabel='Back'
      accessibilityRole='button'
      onPress={() => {
        if (onBack) {
          onBack();
          return;
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          // If opened deeply (e.g., via push notification), fall back to root.
          router.replace('/');
        }
      }}
      style={styles.backButton}
    >
      <ChevronLeft color={semantics.textSecondary} size={20} />
    </TouchableOpacity>
  );
};

type ScreenHeaderProps = {
  titleText: string;
  inSafeArea?: boolean;
  LeftContent?: React.ElementType;
  onBack?: () => void;
  RightContent?: React.ElementType;
  style?: StyleProp<ViewStyle>;
  Subtitle?: React.ElementType;
  subtitleText?: string;
  Title?: React.ElementType;
};

/**
 * ExpoMessaging variant of SampleApp's ScreenHeader. Uses Expo Router's
 * `useRouter` for back navigation and the SDK's theme tokens. No unread-count
 * badge or drawer dependency — kept lean for the example app.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  inSafeArea,
  LeftContent,
  onBack,
  RightContent = () => <View style={{ height: 24, width: 24 }} />,
  style,
  Subtitle,
  subtitleText,
  Title,
  titleText = 'Stream Chat',
}) => {
  const {
    theme: { semantics },
  } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeAreaContainer,
        {
          backgroundColor: semantics.backgroundCoreElevation1,
          borderBottomColor: semantics.borderCoreSubtle,
          height: HEADER_CONTENT_HEIGHT + (inSafeArea ? 0 : insets.top),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.contentContainer,
          {
            height: HEADER_CONTENT_HEIGHT,
            marginTop: inSafeArea ? 0 : insets.top,
          },
        ]}
      >
        <View style={styles.leftContainer}>
          {LeftContent ? <LeftContent /> : <BackButton onBack={onBack} />}
        </View>
        <View style={styles.centerContainer}>
          <View style={{ paddingBottom: !!Subtitle || !!subtitleText ? 3 : 0 }}>
            {Title ? (
              <Title />
            ) : (
              !!titleText && (
                <Text numberOfLines={1} style={[styles.title, { color: semantics.textPrimary }]}>
                  {titleText}
                </Text>
              )
            )}
          </View>
          {Subtitle ? (
            <Subtitle />
          ) : (
            !!subtitleText && (
              <Text numberOfLines={1} style={[styles.subTitle, { color: semantics.textSecondary }]}>
                {subtitleText}
              </Text>
            )
          )}
        </View>
        <View style={styles.rightContainer}>
          <RightContent />
        </View>
      </View>
    </View>
  );
};
