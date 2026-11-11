import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// The agent reply steps' icons, on a 20 × 20 grid with a 1.5 stroke, as in stream-chat-react's
// AI components. Decorative: the text beside each one says what it means.

export type AgentIconProps = { color: string; size?: number };

const circle =
  'M17.5 10C17.5 14.14 14.14 17.5 10 17.5C5.86 17.5 2.5 14.14 2.5 10C2.5 5.86 5.86 2.5 10 2.5C14.14 2.5 17.5 5.86 17.5 10Z';

const strokeIcon = (d: string, mirrorsInRTL = false) => {
  const Icon = ({ color, size = 16 }: AgentIconProps) => (
    <Svg
      accessibilityElementsHidden
      height={size}
      importantForAccessibility='no-hide-descendants'
      viewBox='0 0 20 20'
      width={size}
    >
      <Path
        d={d}
        fill='none'
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        transform={mirrorsInRTL && I18nManager.isRTL ? 'matrix(-1 0 0 1 20 0)' : undefined}
      />
    </Svg>
  );
  return Icon;
};

export const ReasoningIcon = strokeIcon(
  'M7.5 15.625H12.5M8.125 18.125H11.875M10 1.875C6.89 1.875 4.375 4.39 4.375 7.5C4.375 9.53 5.45 11.31 7.06 12.3C7.33 12.47 7.5 12.76 7.5 13.08V13.75H12.5V13.08C12.5 12.76 12.67 12.47 12.94 12.3C14.55 11.31 15.625 9.53 15.625 7.5C15.625 4.39 13.11 1.875 10 1.875Z',
);

export const ChevronIcon = strokeIcon('M7.5 4.375L13.125 10L7.5 15.625', true);

export const CheckIcon = strokeIcon('M4.375 10.625L8.125 14.375L15.625 5.625');

export const FailedIcon = strokeIcon(`M10 6.25V10.625M10 13.75H10.006${circle}`);

export const CancelledIcon = strokeIcon(`M6.875 10H13.125${circle}`);

export const InfoIcon = strokeIcon(`M10 9.375V13.75M10 6.25H10.006${circle}`);

export const HandRaisedIcon = strokeIcon(
  'M10 5V9.375M10 5C10 4.31 10.56 3.75 11.25 3.75C11.94 3.75 12.5 4.31 12.5 5V9.375M10 5V3.75C10 3.06 9.44 2.5 8.75 2.5C8.06 2.5 7.5 3.06 7.5 3.75V5M12.5 6.25C12.5 5.56 13.06 5 13.75 5C14.44 5 15 5.56 15 6.25V11.875C15 15.03 12.84 17.5 10 17.5C7.82 17.5 6.43 16.37 5.42 14.43L3.92 11.53C3.6 10.92 3.84 10.17 4.45 9.86C5 9.58 5.67 9.73 6.04 10.23L7.5 12.19V5M7.5 5V9.375',
);

export const KeyIcon = strokeIcon(
  'M12.5 5.625C13.19 5.625 13.75 6.185 13.75 6.875M16.875 6.875C16.875 9.635 14.635 11.875 11.875 11.875C11.37 11.875 10.88 11.8 10.42 11.66L8.75 13.125H7.5V14.375H6.25V15.625H5V16.875H3.125V14.88L8.34 9.66C8.2 9.2 8.125 8.71 8.125 8.125C8.125 4.94 10.37 1.875 13.75 2.5C15.63 2.85 16.875 4.69 16.875 6.875Z',
);

export const DeviceIcon = strokeIcon(
  'M8.125 15H11.875M6.25 18.125H13.75C14.44 18.125 15 17.565 15 16.875V3.125C15 2.435 14.44 1.875 13.75 1.875H6.25C5.56 1.875 5 2.435 5 3.125V16.875C5 17.565 5.56 18.125 6.25 18.125Z',
);
