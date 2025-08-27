import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useToastState } from '../../hooks/useToastState';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native';
import type { Notification } from 'stream-chat';

const { width } = Dimensions.get('window');

const severityIconMap: Record<Notification['severity'], string> = {
  error: '❌',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
};

export const Toast = () => {
  const { closeToast, notifications } = useToastState();
  const { top } = useSafeAreaInsets();
  const {
    theme: {
      colors: { overlay, white_smoke },
    },
  } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { top }]} pointerEvents='box-none'>
      {notifications.map((notification) => (
        <Animated.View
          key={notification.id}
          entering={SlideInDown.easing(Easing.bezierFn(0.25, 0.1, 0.25, 1.0))}
          exiting={SlideOutDown}
          style={[styles.toast, { backgroundColor: overlay }]}
        >
          <View style={[styles.icon, { backgroundColor: overlay }]}>
            <Text style={[styles.iconText, { color: white_smoke }]}>
              {severityIconMap[notification.severity]}
            </Text>
          </View>
          <View style={styles.content}>
            <Text style={[styles.message, { color: white_smoke }]}>{notification.message}</Text>
          </View>
          <TouchableOpacity onPress={() => closeToast(notification.id)}>
            <Text style={[styles.close, { color: white_smoke }]}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    left: 16,
    alignItems: 'flex-end',
  },
  toast: {
    width: width * 0.9,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    marginHorizontal: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  close: {
    fontSize: 16,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  warning: {
    backgroundColor: 'yellow',
  },
});
