/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const notBabeledDeps = [
  'react-native-image-zoom-viewer',
  'react-native-image-pan-zoom',
  '@stream-io/react-native-simple-markdown',
];

module.exports = {
  title: 'Stream Chat React Native - Docs',
  require: [
    '@babel/polyfill',
    path.join(
      __dirname,
      'src/styleguideComponents/register-react-native-web.js',
    ),
  ],
  styleguideDir: 'docs',
  assetsDir: 'src/assets',
  sortProps: (props) => props,
  serverPort: 6068,
  compilerConfig: {
    transforms: {
      dangerousTaggedTemplateString: true,
    },
    objectAssign: 'Object.assign',
  },
  resolver(ast, recast) {
    return require('react-docgen').resolver.findAllExportedComponentDefinitions(
      ast,
      recast,
    );
  },
  styleguideComponents: {
    PathlineRenderer: path.join(
      __dirname,
      'src/styleguideComponents/PathlineRenderer.js',
    ),
    Slot: path.join(__dirname, 'src/styleguideComponents/Slot.js'),
  },

  sections: [
    {
      name: 'Top Level Component',
      components: ['src/components/Chat/Chat.js'],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Channel Component',
      components: ['src/components/Channel/Channel.js'],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Thread Component',
      components: ['src/components/Thread/Thread.js'],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'ChannelList Components',
      components: [
        'src/components/ChannelList/ChannelList.js',
        'src/components/ChannelList/ChannelListMessenger.js',
        'src/components/ChannelPreview/ChannelPreview.js',
        'src/components/ChannelPreview/ChannelPreviewMessenger.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'MessageList Components',
      components: [
        'src/components/MessageList/DateSeparator.js',
        'src/components/MessageList/EventIndicator.js',
        'src/components/MessageList/MessageList.js',
        'src/components/MessageList/MessageNotification.js',
        'src/components/MessageList/TypingIndicator.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Components',
      components: [
        'src/components/Attachment/Attachment.js',
        'src/components/Attachment/Card.js',
        'src/components/Attachment/FileAttachmentGroup.js',
        'src/components/Attachment/Gallery.js',
        'src/components/Message/Message.js',
        'src/components/Message/MessageSimple/index.js',
        'src/components/Message/MessageSimple/MessageAvatar.js',
        'src/components/Message/MessageSimple/MessageContent.js',
        'src/components/Message/MessageSimple/MessageReplies.js',
        'src/components/Message/MessageSimple/MessageStatus.js',
        'src/components/Message/MessageSimple/MessageTextContainer.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Input',
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
      usageMode: 'expand',
    },
    {
      name: 'Miscellaneous',
      components: [
        'src/components/Avatar/Avatar.js',
        'src/components/CloseButton/CloseButton.js',
        'src/components/FileIcon.js',
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
      sections: [
        {
          name: 'renderText',
          content: 'src/components/docs/renderText.md',
        },
        {
          name: 'Streami18n',
          content: 'src/components/docs/Streami18n.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Contexts',
      sections: [
        {
          name: 'ChatContext',
          content: 'src/components/docs/ChatContext.md',
        },
        {
          name: 'withChatContext',
          content: 'src/components/docs/withChatContext.md',
        },
        {
          name: 'ChannelContext',
          content: 'src/components/docs/ChannelContext.md',
        },
        {
          name: 'withChannelContext',
          content: 'src/components/docs/withChannelContext.md',
        },
        {
          name: 'KeyboardContext',
          content: 'src/components/docs/KeyboardContext.md',
        },
        {
          name: 'withKeyboardContext',
          content: 'src/components/docs/withKeyboardContext.md',
        },
        {
          name: 'MessagesContext',
          content: 'src/components/docs/MessagesContext.md',
        },
        {
          name: 'withMessagesContext',
          content: 'src/components/docs/withMessagesContext.md',
        },
        {
          name: 'SuggestionsContext',
          content: 'src/components/docs/SuggestionsContext.md',
        },
        {
          name: 'withSuggestionsContext',
          content: 'src/components/docs/withSuggestionsContext.md',
        },
        {
          name: 'ThreadContext',
          content: 'src/components/docs/ThreadContext.md',
        },
        {
          name: 'withThreadContext',
          content: 'src/components/docs/withThreadContext.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Custom UI component props',
      sections: [
        {
          name: 'Attachment (in MessageSimple)',
          content: 'src/components/docs/AttachmentProps.md',
        },
        {
          name: 'List (in ChannelList)',
          content: 'src/components/docs/ListProps.md',
        },
        {
          name: 'Message (in MessageList)',
          content: 'src/components/docs/MessageProps.md',
        },
        {
          name: 'MessageText (in MessageSimple)',
          content: 'src/components/docs/MessageText.md',
        },
        {
          name: 'Preview (in ChannelList)',
          content: 'src/components/docs/PreviewProps.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
  ],
  template: {
    favicon: 'https://getstream.imgix.net/images/favicons/favicon-96x96.png',
  },
  webpackConfig: {
    devtool: 'source-map',
    resolve: {
      // auto resolves any react-native import as react-native-web
      alias: {
        'react-native': 'react-native-web',
        'react-native-gesture-handler': 'react-native-web',
        '@stream-io/styled-components':
          '@stream-io/styled-components/native/dist/styled-components.native.cjs.js',
        // Looks ugly in docs, better to just not show it for now
        'react-native-actionsheet': path.join(
          __dirname,
          'src/styleguideComponents/ReactNativeActionSheet.js',
        ),
      },
      extensions: ['.web.js', '.js'],
    },
    devServer: {
      clientLogLevel: 'warn',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            path.join(__dirname, 'src'),
            ...notBabeledDeps.map((dep) =>
              path.join(__dirname, 'node_modules', dep),
            ),
          ],
          options: {
            plugins: [
              'macros',
              '@babel/plugin-transform-runtime',
              '@babel/proposal-object-rest-spread',
              'react-native-web',
            ],
            presets: ['@babel/env', 'module:metro-react-native-babel-preset'],
            babelrc: false,
          },
        },
        {
          test: /\.(jpe?g|png|gif|ttf)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                hash: 'sha512',
                digest: 'hex',
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
    externals: {
      react: 'React',
      'react-native': 'react-native',
      'react-native-web-player': 'react-native-web-player',
    },
  },
};
