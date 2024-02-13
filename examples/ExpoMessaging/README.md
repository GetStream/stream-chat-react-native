# Expo Chat example app

This is a bare minimum Chat application using Stream Chat SDK build using Expo without any customization.

## How to run the app

- Install the expo command line tool and other requirements as specified in the [expo official installation documentation](https://docs.expo.dev/get-started/installation/)

### Clone the Project

```bash
git clone https://github.com/GetStream/stream-chat-react-native.git
```

### Install dependencies
  
1. In the root install the dependencies:

```bash
yarn install
```

2. Move to the `package` directory and install the dependencies:

```bash
cd package && yarn install
```

3. Move to the `expo-package` directory and install the dependencies:

```bash
cd expo-package && yarn install
```

4. Finally, Move to the app directory and install the dependencies:

```bash
cd ../../examples/ExpoMessaging && yarn install
```

### Run

To run the application for different platforms, use the following commands:

- For iOS

```bash
yarn ios
```

- For android

```bash
yarn android
```

**Note:**

If your Android build fails please add the following snippet on the `android/gradle.properties` to make it work.

```
# Disabled hermes in favour of broken Android build due to the package `react-native-quick-sqlite`:
# To Fix:
# A problem occurred evaluating project ':react-native-quick-sqlite'.
# > Cannot get property 'hermesEnabled' on extra properties extension as it does not exist
hermesEnabled=true

# disables the check for multiple instances for gesture handler
# this is needed for react-native-gesture-handler to be both a devDep of core and be a dep on the expo sample app
disableMultipleInstancesCheck=true
```