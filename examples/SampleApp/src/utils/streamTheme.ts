import { DeepPartial, Theme } from 'stream-chat-react-native/v2';

// Read more about style customizations at - https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
const streamTheme: DeepPartial<Theme> = {
  avatar: {
    image: {
      height: 32,
      width: 32,
    },
  },
  colors: {
    primary: 'blue',
  },
  spinner: {
    height: 15,
    width: 15,
  },
};

export { streamTheme };
