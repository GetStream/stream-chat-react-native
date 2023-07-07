# Expo Chat example app

## How to run the app


- Install the expo command line tool and other requirements as specified in the [expo official installation documentation](https://docs.expo.dev/get-started/installation/)

- Clone the project

```bash
   git clone https://github.com/GetStream/stream-chat-react-native.git
```

- Install dependencies

```bash
   cd stream-chat-react-native/package
   make expo-example-deps
```
- Move to the app directory

```bash
   cd ../examples/ExpoMessaging 
```

- Run

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