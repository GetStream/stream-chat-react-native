/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const notBabeledDeps = [
  '@stream-io/react-native-simple-markdown',
  'react-native-image-pan-zoom',
  'react-native-image-zoom-viewer',
];

module.exports = {
  assetsDir: 'src/assets',
  compilerConfig: {
    objectAssign: 'Object.assign',
    transforms: {
      dangerousTaggedTemplateString: true,
    },
  },
  require: [
    '@babel/polyfill',
    path.join(
      __dirname,
      'src/styleguideComponents/register-react-native-web.js',
    ),
  ],
  resolver(ast, recast) {
    return require('react-docgen').resolver.findAllExportedComponentDefinitions(
      ast,
      recast,
    );
  },
  sections: [
    {
      components: ['src/components/Chat/Chat.js'],
      exampleMode: 'collapse',
      name: 'Top Level Component',
      usageMode: 'expand',
    },
    {
      components: ['src/components/Channel/Channel.js'],
      exampleMode: 'collapse',
      name: 'Channel Component',
      usageMode: 'expand',
    },
    {
      components: ['src/components/Thread/Thread.js'],
      exampleMode: 'collapse',
      name: 'Thread Component',
      usageMode: 'expand',
    },
    {
      components: [
        'src/components/ChannelList/ChannelList.js',
        'src/components/ChannelList/ChannelListMessenger.js',
        'src/components/ChannelPreview/ChannelPreview.js',
        'src/components/ChannelPreview/ChannelPreviewMessenger.js',
      ],
      exampleMode: 'collapse',
      name: 'ChannelList Components',
      usageMode: 'expand',
    },
    {
      components: [
        'src/components/MessageList/DateSeparator.js',
        'src/components/MessageList/EventIndicator.js',
        'src/components/MessageList/MessageList.js',
        'src/components/MessageList/MessageNotification.js',
        'src/components/MessageList/TypingIndicator.js',
      ],
      exampleMode: 'collapse',
      name: 'MessageList Components',
      usageMode: 'expand',
    },
    {
      components: [
        'src/components/Attachment/Attachment.js',
        'src/components/Attachment/Card.js',
        'src/components/Attachment/FileAttachmentGroup.js',
        'src/components/Attachment/Gallery.js',
        'src/components/Message/Message.js',
        'src/components/Message/MessageSimple/index.js',
        'src/components/Message/MessageSimple/MessageActionSheet.js',
        'src/components/Message/MessageSimple/MessageAvatar.js',
        'src/components/Message/MessageSimple/MessageContent.js',
        'src/components/Message/MessageSimple/MessageReplies.js',
        'src/components/Message/MessageSimple/MessageStatus.js',
        'src/components/Message/MessageSimple/MessageTextContainer.js',
      ],
      exampleMode: 'collapse',
      name: 'Message Components',
      usageMode: 'expand',
    },
    {
      components: [
        'src/components/AutoCompleteInput/AutoCompleteInput.js',
        'src/components/MessageInput/ActionSheetAttachment.js',
        'src/components/MessageInput/AttachButton.js',
        'src/components/AutoCompleteInput/CommandsItem.js',
        'src/components/MessageInput/FileUploadPreview.js',
        'src/components/MessageInput/ImageUploadPreview.js',
        'src/components/AutoCompleteInput/MentionsItem.js',
        'src/components/MessageInput/MessageInput.js',
        'src/components/MessageInput/SendButton.js',
        'src/components/MessageInput/UploadProgressIndicator.js',
      ],
      exampleMode: 'collapse',
      name: 'Message Input',
      usageMode: 'expand',
    },
    {
      components: [
        'src/components/Avatar/Avatar.js',
        'src/components/CloseButton/CloseButton.js',
        'src/components/Attachment/FileIcon.js',
        'src/components/IconBadge.js',
        'src/components/IconSquare.js',
        'src/components/KeyboardCompatibleView/KeyboardCompatibleView.js',
        'src/components/Indicators/LoadingIndicator.js',
        'src/components/Reaction/ReactionList.js',
        'src/components/Reaction/ReactionPicker.js',
        'src/components/Reaction/ReactionPickerWrapper.js',
        'src/components/Spinner/Spinner.js',
        'src/components/SuggestionsProvider/SuggestionsProvider.js',
      ],
      exampleMode: 'collapse',
      name: 'Miscellaneous',
      sections: [
        {
          content: 'src/components/docs/renderText.md',
          name: 'renderText',
        },
        {
          content: 'src/components/docs/Streami18n.md',
          name: 'Streami18n',
        },
      ],
      usageMode: 'expand',
    },
    {
      exampleMode: 'collapse',
      name: 'Contexts',
      sections: [
        {
          content: 'src/components/docs/ChatContext.md',
          name: 'ChatContext',
        },
        {
          content: 'src/components/docs/withChatContext.md',
          name: 'withChatContext',
        },
        {
          content: 'src/components/docs/ChannelContext.md',
          name: 'ChannelContext',
        },
        {
          content: 'src/components/docs/withChannelContext.md',
          name: 'withChannelContext',
        },
        {
          content: 'src/components/docs/KeyboardContext.md',
          name: 'KeyboardContext',
        },
        {
          content: 'src/components/docs/withKeyboardContext.md',
          name: 'withKeyboardContext',
        },
        {
          content: 'src/components/docs/MessagesContext.md',
          name: 'MessagesContext',
        },
        {
          content: 'src/components/docs/withMessagesContext.md',
          name: 'withMessagesContext',
        },
        {
          content: 'src/components/docs/SuggestionsContext.md',
          name: 'SuggestionsContext',
        },
        {
          content: 'src/components/docs/withSuggestionsContext.md',
          name: 'withSuggestionsContext',
        },
        {
          content: 'src/components/docs/ThreadContext.md',
          name: 'ThreadContext',
        },
        {
          content: 'src/components/docs/withThreadContext.md',
          name: 'withThreadContext',
        },
      ],
      usageMode: 'expand',
    },
    {
      exampleMode: 'collapse',
      name: 'Custom UI component props',
      sections: [
        {
          content: 'src/components/docs/AttachmentProps.md',
          name: 'Attachment (in MessageSimple)',
        },
        {
          content: 'src/components/docs/ListProps.md',
          name: 'List (in ChannelList)',
        },
        {
          content: 'src/components/docs/MessageProps.md',
          name: 'Message (in MessageList)',
        },
        {
          content: 'src/components/docs/MessageText.md',
          name: 'MessageText (in MessageSimple)',
        },
        {
          content: 'src/components/docs/PreviewProps.md',
          name: 'Preview (in ChannelList)',
        },
      ],
      usageMode: 'expand',
    },
  ],
  serverPort: 6068,
  sortProps: (props) => props,
  styleguideComponents: {
    PathlineRenderer: path.join(
      __dirname,
      'src/styleguideComponents/PathlineRenderer.js',
    ),
    Slot: path.join(__dirname, 'src/styleguideComponents/Slot.js'),
  },
  styleguideDir: 'docs',
  template: {
    favicon: 'https://getstream.imgix.net/images/favicons/favicon-96x96.png',
  },
  title: 'Stream Chat React Native - Docs',
  webpackConfig: {
    devServer: {
      clientLogLevel: 'warn',
    },
    devtool: 'source-map',
    externals: {
      react: 'React',
      'react-native': 'react-native',
      'react-native-web-player': 'react-native-web-player',
    },
    module: {
      rules: [
        {
          include: [
            path.join(__dirname, 'src'),
            ...notBabeledDeps.map((dep) =>
              path.join(__dirname, 'node_modules', dep),
            ),
          ],
          loader: 'babel-loader',
          options: {
            babelrc: false,
            plugins: [
              'macros',
              '@babel/plugin-transform-runtime',
              '@babel/proposal-object-rest-spread',
              'react-native-web',
            ],
            presets: ['@babel/env', 'module:metro-react-native-babel-preset'],
          },
          test: /\.js$/,
        },
        {
          test: /\.(jpe?g|png|gif|ttf)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                digest: 'hex',
                hash: 'sha512',
                name: '[hash].[ext]',
                outputPath: 'build/images',
              },
            },
          ],
        },
      ],
    },
    // Most react native projects will need some extra plugin configuration.
    plugins: [
      // Add __DEV__ flag to browser example.
      new webpack.DefinePlugin({
        __DEV__: process.env,
      }),
    ],
    resolve: {
      // auto resolves any react-native import as react-native-web
      alias: {
        '@stream-io/styled-components':
          '@stream-io/styled-components/native/dist/styled-components.native.cjs.js',
        'react-native': 'react-native-web',
        // Looks ugly in docs, better to just not show it for now
        'react-native-actionsheet': path.join(
          __dirname,
          'src/styleguideComponents/ReactNativeActionSheet.js',
        ),
        'react-native-gesture-handler': 'react-native-web',
      },
      extensions: ['.web.js', '.js'],
    },
  },
};
