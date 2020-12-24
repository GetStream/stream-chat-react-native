/* eslint-disable sort-keys */
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CompositeNavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import {
  AppTheme,
  DrawerNavigatorParamList,
  StackNavigatorParamList,
} from '../types';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAttachmentPickerContext } from 'stream-chat-react-native/v2';
import { GoBack } from '../icons/GoBack';

type ScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;
export const BackButton = () => {
  const navigation = useNavigation<ScreenHeaderNavigationProp>();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.goBack();
      }}
      style={{
        padding: 10,
      }}
    >
      <GoBack height={24} width={24} />
    </TouchableOpacity>
  );
};

type ScreenHeaderProps = {
  title: string;
  inSafeArea?: boolean;
  LeftContent?: React.ElementType;
  RightContent?: React.ElementType;
  subtitle?: string | boolean;
};

const HEADER_CONTENT_HEIGHT = 55;

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  LeftContent = BackButton,
  RightContent = () => <View style={{ height: 24, width: 24 }} />,
  title = 'Stream Chat',
  subtitle = false,
  inSafeArea = false,
}) => {
  const insets = useSafeAreaInsets();
  const { setTopInset, topInset } = useAttachmentPickerContext();
  useEffect(() => {
    if (!topInset) {
      setTopInset(HEADER_CONTENT_HEIGHT + insets.top);
    }
  }, [insets.top]);
  const { colors } = useTheme() as AppTheme;

  return (
    <>
      <View
        style={[
          styles.safeAreaContainer,
          {
            backgroundColor: colors.backgroundNavigation,
            height: HEADER_CONTENT_HEIGHT + (inSafeArea ? 0 : insets.top),
          },
        ]}
      >
        <View
          style={[
            styles.contentContainer,
            {
              marginTop: inSafeArea ? 0 : insets.top,
              height: HEADER_CONTENT_HEIGHT,
              paddingBottom: 10,
              paddingLeft: 10,
              paddingRight: 10,
            },
          ]}
        >
          <LeftContent />
          <View
            style={{
              alignItems: 'center',
            }}
          >
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  color: colors.textLight,
                  fontSize: 12,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          <RightContent />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    borderBottomColor: 'rgba(0, 0, 0, 0.0677)',
    borderBottomWidth: 1,
  },
  contentContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    height: 30,
    width: 30,
    borderRadius: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  newDMButton: {
    borderRadius: 20,
  },
});
