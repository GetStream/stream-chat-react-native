module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.streamchatexpo.StreamChatExpoPackage;',
        packageInstance: 'new StreamChatExpoPackage()',
      },
      ios: {
        podspecPath: 'stream-chat-expo.podspec',
      },
    },
  },
};
