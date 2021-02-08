/* eslint-disable sort-keys */
/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const notBabeledDeps = [
  'react-native-markdown-package',
  'react-native-reanimated',
  'react-native-lightbox',
  '@gorhom/bottom-sheet',
  'react-native-svg'
];

const sections = [
  {
    components: ['src/components/Chat/Chat.tsx'],
    exampleMode: 'collapse',
    name: 'Top Level Component',
    usageMode: 'expand',
  },
  {
    components: ['src/components/Channel/Channel.tsx'],
    exampleMode: 'collapse',
    name: 'Channel Component',
    usageMode: 'expand',
  },
  {
    components: ['src/components/Thread/Thread.tsx'],
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
      'src/components/MessageList/DateSeparator.tsx',
      'src/components/MessageList/MessageList.tsx',
      'src/components/MessageList/MessageSystem.tsx',
      'src/components/MessageList/ScrollToBottomButton.tsx',
      'src/components/MessageList/TypingIndicator.tsx',
      'src/components/MessageList/TypingIndicatorContainer.tsx',
    ],
    exampleMode: 'collapse',
    name: 'MessageList Components',
    usageMode: 'expand',
  },
  {
    components: [
      'src/components/Message/Message.tsx',
      'src/components/Message/MessageSimple/MessageSimple.tsx',
      'src/components/Message/MessageSimple/MessageActionSheet.tsx',
      'src/components/Message/MessageSimple/MessageAvatar.tsx',
      'src/components/Message/MessageSimple/MessageContent.tsx',
      'src/components/Message/MessageSimple/MessageReplies.tsx',
      'src/components/Message/MessageSimple/MessageStatus.tsx',
      'src/components/Message/MessageSimple/MessageTextContainer.tsx',
      'src/components/Attachment/Attachment.tsx',
      'src/components/Attachment/AttachmentActions.tsx',
      'src/components/Attachment/Card.tsx',
      'src/components/Attachment/FileAttachment.tsx',
      'src/components/Attachment/FileAttachmentGroup.tsx',
      'src/components/Attachment/Gallery.tsx',
    ],
    exampleMode: 'collapse',
    name: 'Message Components',
    usageMode: 'expand',
  },
  {
    components: [
      'src/components/AutoCompleteInput/AutoCompleteInput.tsx',
      'src/components/MessageInput/ActionSheetAttachment.tsx',
      'src/components/MessageInput/AttachButton.tsx',
      'src/components/AutoCompleteInput/CommandsItem.tsx',
      'src/components/MessageInput/FileUploadPreview.tsx',
      'src/components/MessageInput/ImageUploadPreview.tsx',
      'src/components/AutoCompleteInput/MentionsItem.tsx',
      'src/components/MessageInput/MessageInput.tsx',
      'src/components/MessageInput/SendButton.tsx',
      'src/components/MessageInput/UploadProgressIndicator.tsx',
    ],
    exampleMode: 'collapse',
    name: 'MessageInput Components',
    usageMode: 'expand',
  },
  {
    components: [
      'src/components/Avatar/Avatar.tsx',
      'src/components/CloseButton/CloseButton.tsx',
      'src/components/IconBadge.tsx',
      'src/components/IconSquare.tsx',
      'src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx',
      'src/components/Indicators/LoadingIndicator.tsx',
      'src/components/Reaction/ReactionList.tsx',
      'src/components/Reaction/ReactionPicker.tsx',
      'src/components/Reaction/ReactionPickerWrapper.tsx',
      'src/components/Spinner/Spinner.tsx',
    ],
    exampleMode: 'collapse',
    name: 'Miscellaneous',
    sections: [
      {
        content: 'src/components/Message/MessageSimple/utils/renderText.md',
        name: 'renderText',
      },
      {
        content: 'src/utils/Streami18n.md',
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
        content: 'src/contexts/overlayContext/OverlayContext.md',
        name: 'OverlayContext',
      },
      {
        content: 'src/contexts/overlayContext/withOverlayContext.md',
        name: 'withOverlayContext',
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
    name: 'Custom UI Component Props',
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
        content: 'src/components/Message/MessageSimple/MessageText.md',
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
  sortProps: (props) => props,
  styles: {
    StyleGuide: {
      '@global body': {
        fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans"'
      }
    }
  },
  serverPort: 6068,
  compilerConfig: {
    transforms: {
      dangerousTaggedTemplateString: true,
      moduleImport: false,
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
      propFilter: { skipPropsWithoutDoc: false },
      shouldRemoveUndefinedFromOptional: true,
      shouldExtractLiteralValuesFromEnum: true
    },
  ).parse,
  styleguideComponents: {
    PathlineRenderer: path.join(
      __dirname,
      'src/styleguideComponents/PathlineRenderer.tsx',
    ),
    Wrapper: path.join(__dirname, 'src/styleguideComponents/Wrapper.tsx'),
    PropsRenderer: path.join(__dirname, 'src/styleguideComponents/PropsRenderer.tsx'),
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
        '@gorhom/bottom-sheet': path.join(
          __dirname,
          'src/styleguideComponents/BottomSheet.tsx',
        ),
        'react-native-markdown-package': path.join(
          __dirname,
          'src/styleguideComponents/Markdown.tsx',
        ),
        'react-native-svg': 'react-native-svg/src/ReactNativeSVG.web',
        'react-native-reanimated': 'react-native-reanimated/src/reanimated2/js-reanimated/index.js',
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
            plugins: ['module-resolver', 'react-native-web'],
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
