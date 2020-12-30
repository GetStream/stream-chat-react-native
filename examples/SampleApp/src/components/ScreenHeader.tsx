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
import {
  useAttachmentPickerContext,
  useTheme,
} from 'stream-chat-react-native/v2';

import { GoBack } from '../icons/GoBack';

import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { StackNavigationProp } from '@react-navigation/stack';
import type {
  DrawerNavigatorParamList,
  StackNavigatorParamList,
} from '../types';
import { UnreadCountBadge } from './UnreadCountBadge';

type ScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;
export const BackButton = ({ showUnreadCountBadge = false }) => {
  const navigation = useNavigation<ScreenHeaderNavigationProp>();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.goBack();
      }}
      style={{
        flexWrap: 'nowrap',
        overflow: 'visible',
        padding: 10,
      }}
    >
      <GoBack />
      {!!showUnreadCountBadge && (
        <View
          style={{
            left: 25,
            position: 'absolute',
          }}
        >
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
  RightContent?: React.ElementType;
  showUnreadCountBadge?: boolean;
  style?: StyleProp<ViewStyle>;
  Subtitle?: React.ElementType | null;
  subtitleText?: string | boolean;
  Title?: React.ElementType | null;
};

const HEADER_CONTENT_HEIGHT = 55;

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  inSafeArea = false,
  LeftContent,
  RightContent = () => <View style={{ height: 24, width: 24 }} />,
  showUnreadCountBadge = false,
  style,
  Subtitle = null,
  subtitleText = false,
  Title = null,
  titleText = 'Stream Chat',
}) => {
  const insets = useSafeAreaInsets();
  const { setTopInset, topInset } = useAttachmentPickerContext();
  useEffect(() => {
    if (setTopInset && !topInset) {
      setTopInset(HEADER_CONTENT_HEIGHT + insets.top);
    }
  }, [insets.top]);
  const {
    theme: {
      colors: { black, border, grey, white },
    },
  } = useTheme();

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
            paddingBottom: 10,
            paddingHorizontal: 10,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          {LeftContent ? (
            <LeftContent />
          ) : (
            <BackButton showUnreadCountBadge={showUnreadCountBadge} />
          )}
        </View>
        <View
          style={{
            alignItems: 'center',
            flexGrow: 1,
            flexShrink: 1,
            justifyContent: 'center',
          }}
        >
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
                      fontSize: 16,
                      fontWeight: '700',
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
                style={{
                  color: grey,
                  fontSize: 12,
                }}
              >
                {subtitleText}
              </Text>
            )
          )}
        </View>
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <RightContent />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    borderRadius: 5,
    height: 30,
    width: 30,
  },
  newDMButton: {
    borderRadius: 20,
  },
  safeAreaContainer: {
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
