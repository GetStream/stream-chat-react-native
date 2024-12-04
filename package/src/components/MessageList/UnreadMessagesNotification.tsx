import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Close } from '../../icons';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

export type UnreadMessagesNotificationProps = {
  /**
   * Callback to handle the press event
   */
  onPressHandler: () => void;
  /**
   * Callback to handle the close event
   */
  onCloseHandler?: () => void;

  /**
   * If the notification is visible
   */
  visible?: boolean;
};

export const UnreadMessagesNotification = (props: UnreadMessagesNotificationProps) => {
  const { onCloseHandler, onPressHandler, visible = true } = props;
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { text_low_emphasis, white_snow },
      typingIndicator: { container },
    },
  } = useTheme();

  if (!visible) return null;

  return (
    <Pressable
      onPress={onPressHandler}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: text_low_emphasis, opacity: pressed ? 0.8 : 1 },
        container,
      ]}
    >
      <Text style={[styles.text, { color: white_snow }]}>{t<string>('Unread Messages')}</Text>
      <Pressable
        onPress={onCloseHandler}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Close pathFill={white_snow} />
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'absolute',
    top: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,

    elevation: 4,
  },
  text: {
    marginRight: 8,
    fontWeight: '500',
  },
});
