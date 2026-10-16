import React from 'react';
import { Alert } from 'react-native';

import { Copy, Edit, FilePickerIcon, Flag, IconProps, Picture } from 'stream-chat-expo';

// The sheet renders each icon without props, and some SDK icons (e.g. `Flag`, `Copy`) only draw
// with an explicit stroke, so every icon gets the same colour here.
const withStroke = (Icon: React.ComponentType<IconProps>) => {
  const StrokedIcon = () => <Icon stroke='#000000' />;
  StrokedIcon.displayName = `Stroked(${Icon.displayName ?? Icon.name})`;
  return StrokedIcon;
};

export const bottomSheetOptions = [
  {
    title: 'Create Image',
    subtitle: 'Visualize anything',
    action: () => Alert.alert('Pressed on Create Image !'),
    Icon: withStroke(Picture),
  },
  {
    title: 'Thinking',
    subtitle: 'Think longer for better answers',
    action: () => Alert.alert('Pressed on Thinking !'),
    Icon: withStroke(Flag),
  },
  {
    title: 'Deep research',
    subtitle: 'Get a detailed report',
    action: () => Alert.alert('Pressed on Deep research !'),
    Icon: withStroke(FilePickerIcon),
  },
  {
    title: 'Web search',
    subtitle: 'Find real-time news and info',
    action: () => Alert.alert('Pressed on Web search !'),
    Icon: withStroke(Copy),
  },
  {
    title: 'Study and learn',
    subtitle: 'Learn a new concept',
    action: () => Alert.alert('Pressed on Study and learn !'),
    Icon: withStroke(Edit),
  },
];
