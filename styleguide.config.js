/* eslint-disable sort-keys */
/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const notBabeledDeps = [
  'react-native-image-zoom-viewer',
  'react-native-image-pan-zoom',
  '@stream-io/react-native-simple-markdown',
];

const sections = [
  {
    components: ['src/components/Chat/Chat.tsx'],
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
      'src/components/ChannelList/ChannelList.tsx',
      'src/components/ChannelList/ChannelListMessenger.tsx',
      'src/components/ChannelPreview/ChannelPreview.tsx',
      'src/components/ChannelPreview/ChannelPreviewMessenger.tsx',
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
      'src/components/MessageList/MessageSystem.js',
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
      'src/components/AutoCompleteInput/CommandsItem.tsx',
      'src/components/MessageInput/FileUploadPreview.js',
      'src/components/MessageInput/ImageUploadPreview.js',
      'src/components/AutoCompleteInput/MentionsItem.tsx',
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
      'src/components/Avatar/Avatar.tsx',
      'src/components/CloseButton/CloseButton.js',
      'src/components/FileIcon.js',
      'src/components/IconBadge.js',
      'src/components/IconSquare.js',
      'src/components/KeyboardCompatibleView/KeyboardCompatibleView.js',
      'src/components/Indicators/LoadingIndicator.tsx',
      'src/components/Reaction/ReactionList.js',
      'src/components/Reaction/ReactionPicker.js',
      'src/components/Reaction/ReactionPickerWrapper.js',
      'src/components/Spinner/Spinner.tsx',
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
        content: 'src/contexts/chatContext/ChatContext.md',
        name: 'ChatContext',
      },
      {
        content: 'src/contexts/chatContext/withChatContext.md',
        name: 'withChatContext',
      },
      {
        content: 'src/contexts/channelContext/ChannelContext.md',
        name: 'ChannelContext',
      },
      {
        content: 'src/contexts/channelContext/withChannelContext.md',
        name: 'withChannelContext',
      },
      {
        content: 'src/contexts/keyboardContext/KeyboardContext.md',
        name: 'KeyboardContext',
      },
      {
        content: 'src/contexts/keyboardContext/withKeyboardContext.md',
        name: 'withKeyboardContext',
      },
      {
        content: 'src/contexts/messagesContext/MessagesContext.md',
        name: 'MessagesContext',
      },
      {
        content: 'src/contexts/messagesContext/withMessagesContext.md',
        name: 'withMessagesContext',
      },
      {
        content: 'src/contexts/suggestionsContext/SuggestionsContext.md',
        name: 'SuggestionsContext',
      },
      {
        content: 'src/contexts/suggestionsContext/withSuggestionsContext.md',
        name: 'withSuggestionsContext',
      },
      {
        content: 'src/contexts/threadContext/ThreadContext.md',
        name: 'ThreadContext',
      },
      {
        content: 'src/contexts/threadContext/withThreadContext.md',
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
  propsParser: require('react-docgen-typescript').withCustomConfig(
    './tsconfig.json',
    {
      propFilter: { skipPropsWithoutDoc: true },
    },
  ).parse,
  styleguideComponents: {
    PathlineRenderer: path.join(
      __dirname,
      'src/styleguideComponents/PathlineRenderer.js',
    ),
    Slot: path.join(__dirname, 'src/styleguideComponents/Slot.js'),
  },
  sections,
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
        'styled-components/native':
          'styled-components/native/dist/styled-components.native.cjs.js',
        'styled-components':
          'styled-components/native/dist/styled-components.native.cjs.js',
        // Looks ugly in docs, better to just not show it for now
        'react-native-actionsheet': path.join(
          __dirname,
          'src/styleguideComponents/ReactNativeActionSheet.js',
        ),
      },
      extensions: ['.web.js', '.js', '.ts', '.tsx'],
    },
    devServer: {
      clientLogLevel: 'warn',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          loader: 'babel-loader',
          include: [
            path.join(__dirname, 'src'),
            ...notBabeledDeps.map((dep) =>
              path.join(__dirname, 'node_modules', dep),
            ),
          ],
          options: {
            comments: true,
            plugins: [
              'macros',
              'module-resolver',
              'react-native-web',
              'babel-plugin-styled-components',
            ],
            presets: [
              'module:metro-react-native-babel-preset',
              '@babel/preset-typescript',
            ],
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
