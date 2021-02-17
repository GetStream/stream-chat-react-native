import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttachmentPickerContext, useTheme } from 'stream-chat-react-native';

import { UnreadCountBadge } from './UnreadCountBadge';

import { GoBack } from '../icons/GoBack';

import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { StackNavigationProp } from '@react-navigation/stack';

import type {
  DrawerNavigatorParamList,
  StackNavigatorParamList,
} from '../types';

const styles = StyleSheet.create({
  backButton: {
    paddingVertical: 8,
  },
  backButtonUnreadCount: {
    left: 25,
    position: 'absolute',
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

type ScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;

export const BackButton: React.FC<{
  onBack?: () => void;
  showUnreadCountBadge?: boolean;
}> = ({ onBack, showUnreadCountBadge }) => {
  const navigation = useNavigation<ScreenHeaderNavigationProp>();

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.goBack();
        if (onBack) {
          onBack();
        }
      }}
      style={styles.backButton}
    >
      <GoBack />
      {!!showUnreadCountBadge && (
        <View style={styles.backButtonUnreadCount}>
          <UnreadCountBadge />
        </View>
      )}
    </TouchableOpacity>
  );
};

type ScreenHeaderProps = {
  titleText: string;
  inSafeArea?: boolean;
  LeftContent?: React.ElementType;
  onBack?: () => void;
  RightContent?: React.ElementType;
  showUnreadCountBadge?: boolean;
  style?: StyleProp<ViewStyle>;
  Subtitle?: React.ElementType;
  subtitleText?: string;
  Title?: React.ElementType;
};

const HEADER_CONTENT_HEIGHT = 55;

export const ScreenHeader: React.FC<ScreenHeaderProps> = (props) => {
  const {
    inSafeArea,
    LeftContent,
    onBack,
    RightContent = () => <View style={{ height: 24, width: 24 }} />,
    showUnreadCountBadge,
    style,
    Subtitle,
    subtitleText,
    Title,
    titleText = 'Stream Chat',
  } = props;

  const {
    theme: {
      colors: { black, border, grey, white },
    },
  } = useTheme();
  const insets = useSafeAreaInsets();
  const { setTopInset, topInset } = useAttachmentPickerContext();

  useEffect(() => {
    if (setTopInset && !topInset) {
      setTopInset(HEADER_CONTENT_HEIGHT + insets.top);
    }
  }, [insets.top]);

  return (
    <View
      style={[
        styles.safeAreaContainer,
        {
          backgroundColor: white,
          borderBottomColor: border,
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
          {LeftContent ? (
            <LeftContent />
          ) : (
            <BackButton
              onBack={onBack}
              showUnreadCountBadge={showUnreadCountBadge}
            />
          )}
        </View>
        <View style={styles.centerContainer}>
          <View style={{ paddingBottom: !!Subtitle || !!subtitleText ? 3 : 0 }}>
            {Title ? (
              <Title />
            ) : (
              !!titleText && (
                <Text
                  style={[
                    styles.title,
                    {
                      color: black,
                    },
                  ]}
                >
                  {titleText}
                </Text>
              )
            )}
          </View>
          {Subtitle ? (
            <Subtitle />
          ) : (
            !!subtitleText && (
              <Text
                style={[
                  styles.subTitle,
                  {
                    color: grey,
                  },
                ]}
              >
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
