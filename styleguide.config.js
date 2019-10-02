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
      name: 'Top Level Components',
      components: [
        'src/components/Chat.js',
        'src/components/Channel.js',
        'src/components/ChannelList.js',
        'src/components/MessageList.js',
        'src/components/ChannelHeader.js',
        'src/components/Thread.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Components',
      components: [
        'src/components/Message.js',
        'src/components/MessageSimple/index.js',
        'src/components/Attachment.js',
        'src/components/AttachmentActions.js',
        'src/components/AutoComplete.js',
        'src/components/ReactionSelector.js',
        'src/components/MessageActionsBox.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Message Input',
      components: [
        'src/components/MessageInput.js',
        'src/components/ImageUploadPreview.js',
        'src/components/FileUploadPreview.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Utilities',
      components: [
        'src/components/Card.js',
        'src/components/ChatDown.js',
        'src/components/LoadingChannels.js',
        'src/components/Avatar.js',
        'src/components/Spinner.js',
        'src/components/LoadingIndicator.js',
        'src/components/Image.js',
        'src/components/SendButton.js',
        'src/components/DateSeparator.js',
        'src/components/Window.js',
        'src/components/ChannelListMessenger.js',
        'src/components/ChannelPreviewMessenger.js',
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
          name: 'SuggestionsContext',
          content: 'src/components/docs/SuggestionsContext.md',
        },
        {
          name: 'withSuggestionsContext',
          content: 'src/components/docs/withSuggestionsContext.md',
        },
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    {
      name: 'Custom UI component props',
      sections: [
        {
          name: 'List (in ChannelList)',
          content: 'src/components/docs/ListProps.md',
        },
        {
          name: 'Preview (in ChannelList)',
          content: 'src/components/docs/PreviewProps.md',
        },
        {
          name: 'Message (in MessageList)',
          content: 'src/components/docs/MessageProps.md',
        },
        {
          name: 'Attachment (in MessageSimple)',
          content: 'src/components/docs/AttachmentProps.md',
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
              '@babel/proposal-class-properties',
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
