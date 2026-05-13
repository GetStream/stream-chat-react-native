This directory contains all the example apps that use our Stream Chat React Native SDK components.

The three apps -- `SampleApp`, `ExpoMessaging`, `TypeScriptMessaging` -- are Yarn 4 workspaces of the repo root. A single `yarn install` at the repo root sets all of them up; their SDK dependencies (`stream-chat-react-native-core`, `stream-chat-react-native`, `stream-chat-expo`) are wired via `workspace:^`, and each app's `metro.config.js` adds the SDK source to Metro's watch folders and resolution table.

On RN <= 0.72, symlink was not supported by default so the setup has to be done locally through metro config to run the project within the monorepo. The guide below addresses the same -- it remains useful when you want to consume a locally-cloned SDK from an app that lives **outside** this monorepo.

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

(Within this repo, the in-monorepo apps use `"workspace:^"` instead of `link:` -- the snippet above is for an app that lives outside the monorepo.)

Here I am assuming that the clone of `stream-chat-react-native` and your app are under common directory. For example,

```
-- project-dir
    -- stream-chat-react-native
    -- my-chat-app
```

### Metro config

If you run your app at this point, you'll hit `dependency collision` errors -- Metro doesn't know how to resolve modules (`react`, `react-native`, etc.) that appear both under your app's `node_modules` and under the cloned SDK's. You need to teach Metro which copy of each shared package to use and where to watch for SDK source changes.

The cleanest reference is the in-repo example: [`examples/SampleApp/metro.config.js`](./SampleApp/metro.config.js). It uses `@react-native/metro-config` + `@rnx-kit/metro-config`'s `resolveUniqueModule` to handle deduplication, then adds the SDK directories to Metro's `watchFolders`. Copy that file into your app and adjust the paths to point at your local clone of `stream-chat-react-native`.

Then clean-install:

```
rm -rf node_modules
rm yarn.lock
yarn install
watchman watch-del-all
yarn start --reset-cache
```

Changes you make in your local SDK clone will be reflected in your application.

## Samples repository

Apart from the samples we use for internal development, we also provide some other
small clone projects like a Slack clone and an iMessage clone. You can check out the code
in [our repository](https://github.com/GetStream/react-native-samples) and even run the apps yourself.
