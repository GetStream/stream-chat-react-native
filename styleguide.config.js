/* eslint-env node */
const path = require('path');
const webpack = require('webpack');

const notBabeledDeps = [
  'react-native-image-zoom-viewer',
  'react-native-image-pan-zoom',
  'react-native-simple-markdown',
];

module.exports = {
  title: 'Stream Chat React Native - Docs',
  require: ['@babel/polyfill'],
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
        'src/components/MessageSimple.js',
        'src/components/MessageTeam.js',
        'src/components/MessageLivestream.js',
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
        'src/components/MessageInputSmall.js',
        'src/components/MessageInputLarge.js',
        'src/components/MessageInputFlat.js',
        'src/components/ChatAutoComplete.js',
        'src/components/AutoComplete.js',
        'src/components/EditMessageForm.js',
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
        'src/components/LoadingIndicator.js',
        'src/components/Image.js',
        'src/components/DateSeparator.js',
        'src/components/Window.js',
      ],
      exampleMode: 'collapse',
      usageMode: 'expand',
    },
    // {
    //   name: 'Styles',
    //   content: 'docs/styles.md',
    // },
  ],
  template: {
    favicon: 'https://getstream.imgix.net/images/favicons/favicon-96x96.png',
  },
  webpackConfig: {
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
    },
  },
};
