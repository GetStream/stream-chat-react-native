This directory contains all the example apps that uses our Stream Chat React Native SDK components.

On RN <= 0.72, symlink was not supported by default so the setup has to be done locally through metro config to run the project within the monorepo. The guide below addresses the same.

### Running a local SDK clone on your app
​
If you're contributing and trying to link the SDK into your own React Native project, you may find
some challenges on the way once [Metro doesn't follow symlinks](https://github.com/facebook/metro/issues/1).
Because of that, there is a few specific steps you need to follow in order to run things properly.

### Linking the SDK into your package.json

First step is to link the SDK dependency to the locally cloned repository.
Replace the `stream-chat-react-native` dependency with following:

```json
"stream-chat-react-native-core": "link:../stream-chat-react-native/package",
"stream-chat-react-native": "link:../stream-chat-react-native/package/native-package", // If youre using the native package
"stream-chat-expo": "link:../stream-chat-react-native/package/expo-package", // If youre using expo
```

Here I am assuming that the clone of `stream-chat-react-native` and your app are under common directory. For example,

```
-- project-dir
    -- stream-chat-react-native
    -- my-chat-app
```

### Metro config

If you run your app at this point, you will run into some issues related to `dependency collision`.
Since metro bundler will have `node_module` dependencies from your `app` folder, `stream-chat-react-native`
folder and `stream-chat-react-native/native-package` folder. And it doesn't know how to resolve those
dependencies.

So you need to modify `metro.config.js`. We added some helpers for that inside of our package.
You can copy-paste the following config:

:::note
If you're using an older `metro-config` version, you may need to replace

```js
const blacklist = require('metro-config/src/defaults/exclusionList');
```

with

```js
const blacklist = require('metro-config/src/defaults/blackList');
```

:::

```js
const PATH = require('path');
const blacklist = require('metro-config/src/defaults/exclusionList');

const extractLinkedPackages = require('stream-chat-react-native-core/metro-dev-helpers/extract-linked-packages');

const projectRoot = PATH.resolve(__dirname);

const { alternateRoots, extraNodeModules, moduleBlacklist } = extractLinkedPackages(projectRoot);

module.exports = {
  resolver: {
    blacklistRE: blacklist(moduleBlacklist),
    extraNodeModules,
    useWatchman: false,
  },
  watchFolders: [projectRoot].concat(alternateRoots),
};
```

And as last step, clean install your app.

```
rm -rf node_modules
rm yarn.lock
yarn install
watchman watch-del-all
yarn start --reset-cache
```

And that's all. If you make code changes in `stream-chat-react-native`, they should reflect in your application.

## Samples repository

Apart from the samples we use for internal development, we also provide some other
small clone projects like a Slack clone and an iMessage clone. You can check out the code
in [our repository](https://github.com/GetStream/react-native-samples) and even run the apps yourself.