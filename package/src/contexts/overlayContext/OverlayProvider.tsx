import React, { ReactChildren } from 'react';
import { View } from 'react-native';

/**
 * - The highest level of these components is the `OverlayProvider`. The `OverlayProvider` allows users to interact with messages on long press above the underlying views, use the full screen image viewer, and use the `AttachmentPicker` as a keyboard-esk view.
 *  Because these views must exist above all others `OverlayProvider` should wrap your navigation stack as well. Assuming [`React Navigation`](https://reactnavigation.org/) is being used, your highest level navigation stack should be wrapped in the provider:
 *
 *    ```js
 *    <NavigationContainer>
 *      <OverlayProvider>
 *        <Stack.Navigator>
 *          <Stack.Screen />
 *        </Stack.Navigator>
 *      </OverlayProvider>
 *    </NavigationContainer>
 *    ```
 *
 * - Don't forget to check our cookbook section of [OverlayProvider](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#overlayprovider)
 *
 * - Also check the [visual component guide](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#custom-components), to learn about component customizations.
 *
 * @example ./OverlayProvider.md
 */
export const OverlayProvider = (props: { children: ReactChildren }) => {
  const { children } = props;

  return <View key={1}>{children}</View>;
};
