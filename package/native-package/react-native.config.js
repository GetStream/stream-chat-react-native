module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.streamchatreactnative.StreamChatReactNativePackage;',
        packageInstance: 'new StreamChatReactNativePackage()',
      },
      ios: {
        podspecPath: 'stream-chat-react-native.podspec',
      },
    },
  },
};
