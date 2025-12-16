import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior='onScrollDown'>
      <NativeTabs.Trigger name='index'>
        <Label>Chat</Label>
        <Icon sf='house.fill' drawable='custom_android_drawable' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='threads'>
        <Label>Threads</Label>
        <Icon sf='gear' drawable='custom_settings_drawable' />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
