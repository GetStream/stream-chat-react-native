import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// The agent replies' icons, on a 20 × 20 grid with a 1.5 stroke. Decorative: the text beside each
// one, or its button's label, says what it means.

export type AgentIconProps = { color: string; size?: number };

const circle =
  'M17.5 10C17.5 14.14 14.14 17.5 10 17.5C5.86 17.5 2.5 14.14 2.5 10C2.5 5.86 5.86 2.5 10 2.5C14.14 2.5 17.5 5.86 17.5 10Z';

type StrokeIconOptions = {
  /** Filled with its colour as well as drawn, such as a chosen rating. */
  filled?: boolean;
  /** Flipped in a right-to-left layout, for one that points somewhere. */
  mirrorsInRTL?: boolean;
  /** Turned around the grid's centre, in degrees. */
  rotation?: number;
};

const strokeIcon = (
  d: string,
  { filled = false, mirrorsInRTL = false, rotation }: StrokeIconOptions = {},
) => {
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
        fill={filled ? color : 'none'}
        stroke={color}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        transform={
          mirrorsInRTL && I18nManager.isRTL
            ? 'matrix(-1 0 0 1 20 0)'
            : rotation
              ? `rotate(${rotation} 10 10)`
              : undefined
        }
      />
    </Svg>
  );
  return Icon;
};

export const ReasoningIcon = strokeIcon(
  'M7.5 15.625H12.5M8.125 18.125H11.875M10 1.875C6.89 1.875 4.375 4.39 4.375 7.5C4.375 9.53 5.45 11.31 7.06 12.3C7.33 12.47 7.5 12.76 7.5 13.08V13.75H12.5V13.08C12.5 12.76 12.67 12.47 12.94 12.3C14.55 11.31 15.625 9.53 15.625 7.5C15.625 4.39 13.11 1.875 10 1.875Z',
);

// Points down in either direction, so it isn't mirrored.
export const ArrowDownIcon = strokeIcon('M10 3.75V16.25M4.375 10.625L10 16.25L15.625 10.625');

export const ChevronIcon = strokeIcon('M7.5 4.375L13.125 10L7.5 15.625', { mirrorsInRTL: true });

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

// A message's actions.

export const CopyIcon = strokeIcon(
  'M13.125 13.125H16.875V3.125H6.875V6.875M3.125 6.875H13.125V16.875H3.125V6.875Z',
);

export const CopiedIcon = strokeIcon('M3.125 11.25L7.5 15.625L17.5 5.625');

export const ShareIcon = strokeIcon(
  'M13.125 6.25L10 3.125M10 3.125L6.875 6.25M10 3.125V12.5M6.875 8.75H5C4.31 8.75 3.75 9.31 3.75 10V15.625C3.75 16.315 4.31 16.875 5 16.875H15C15.69 16.875 16.25 16.315 16.25 15.625V10C16.25 9.31 15.69 8.75 15 8.75H13.125',
);

export const RegenerateIcon = strokeIcon(
  'M13.125 7.5H16.875M16.875 7.5V3.75M16.875 7.5L14.67 5.29C13.39 4.01 11.65 3.29 9.84 3.28C8.03 3.27 6.29 3.97 5 5.23M6.875 12.5H3.125M3.125 12.5V16.25M3.125 12.5L5.33 14.71C6.61 15.99 8.35 16.71 10.16 16.72C11.97 16.73 13.71 16.03 15 14.77',
);

export const EditIcon = strokeIcon(
  'M10.625 5L15 9.375M7.24 16.875H3.75C3.58 16.875 3.43 16.81 3.31 16.69C3.19 16.57 3.125 16.42 3.125 16.25V12.76C3.125 12.59 3.19 12.43 3.31 12.32L12.94 2.68C13.06 2.57 13.22 2.5 13.38 2.5C13.55 2.5 13.71 2.57 13.83 2.68L17.32 6.17C17.43 6.29 17.5 6.45 17.5 6.61C17.5 6.78 17.43 6.94 17.32 7.06L7.68 16.69C7.57 16.81 7.41 16.875 7.24 16.875Z',
);

export const FileIcon = strokeIcon(
  'M11.875 2.5H4.375C4.21 2.5 4.05 2.57 3.93 2.68C3.82 2.8 3.75 2.96 3.75 3.125V16.875C3.75 17.04 3.82 17.2 3.93 17.32C4.05 17.43 4.21 17.5 4.375 17.5H15.625C15.79 17.5 15.95 17.43 16.07 17.32C16.18 17.2 16.25 17.04 16.25 16.875V6.875M11.875 2.5L16.25 6.875M11.875 2.5V6.875H16.25',
);

const thumb =
  'M5.625 8.75V16.25M5.625 8.75H3.75C3.405 8.75 3.125 9.03 3.125 9.375V15.625C3.125 15.97 3.405 16.25 3.75 16.25H5.625M5.625 8.75L8.75 2.5C9.44 2.5 10.1 2.77 10.59 3.26C11.08 3.75 11.25 4.41 11.25 5.1V6.875H15.94C16.12 6.875 16.29 6.91 16.45 6.99C16.61 7.06 16.75 7.17 16.86 7.3C16.98 7.43 17.06 7.59 17.11 7.75C17.16 7.92 17.17 8.09 17.15 8.27L16.21 15.77C16.17 16.07 16.03 16.34 15.8 16.54C15.58 16.74 15.29 16.85 14.99 16.85H5.625';

export const ThumbsUpIcon = strokeIcon(thumb);

export const ThumbsUpFilledIcon = strokeIcon(thumb, { filled: true });

export const ThumbsDownIcon = strokeIcon(thumb, { rotation: 180 });

export const ThumbsDownFilledIcon = strokeIcon(thumb, { filled: true, rotation: 180 });

// A file's type, on its attachment's tile.

export const PdfIcon = strokeIcon(
  'M11.875 2.5H4.375C4.21 2.5 4.05 2.57 3.93 2.68C3.82 2.8 3.75 2.96 3.75 3.125V16.875C3.75 17.04 3.82 17.2 3.93 17.32C4.05 17.43 4.21 17.5 4.375 17.5H15.625C15.79 17.5 15.95 17.43 16.07 17.32C16.18 17.2 16.25 17.04 16.25 16.875V6.875M11.875 2.5L16.25 6.875M11.875 2.5V6.875H16.25M6.875 10.625H13.125M6.875 13.75H13.125',
);

export const ImageIcon = strokeIcon(
  'M4.43 16.875L13 8.31C13.05 8.25 13.12 8.2 13.2 8.17C13.27 8.14 13.36 8.125 13.44 8.125C13.52 8.125 13.6 8.14 13.68 8.17C13.75 8.2 13.82 8.25 13.88 8.31L16.875 11.3M3.75 3.125H16.25C16.6 3.125 16.875 3.4 16.875 3.75V16.25C16.875 16.6 16.6 16.875 16.25 16.875H3.75C3.4 16.875 3.125 16.6 3.125 16.25V3.75C3.125 3.4 3.4 3.125 3.75 3.125ZM8.75 7.5C8.75 8.19 8.19 8.75 7.5 8.75C6.81 8.75 6.25 8.19 6.25 7.5C6.25 6.81 6.81 6.25 7.5 6.25C8.19 6.25 8.75 6.81 8.75 7.5Z',
);

export const AudioIcon = strokeIcon(
  'M3.75 8.125V11.875M6.875 5.625V14.375M10 3.125V16.875M13.125 6.875V13.125M16.25 8.75V11.25',
);

export const VideoIcon = strokeIcon(
  'M15.625 8.75L19.375 6.25V13.75L15.625 11.25M2.5 5H15C15.35 5 15.625 5.28 15.625 5.625V14.375C15.625 14.72 15.35 15 15 15H2.5C2.15 15 1.875 14.72 1.875 14.375V5.625C1.875 5.28 2.15 5 2.5 5Z',
);

export const ArchiveIcon = strokeIcon(
  'M16.875 7.5V15C16.875 15.17 16.81 15.32 16.69 15.44C16.57 15.56 16.42 15.625 16.25 15.625H3.75C3.58 15.625 3.43 15.56 3.31 15.44C3.19 15.32 3.125 15.17 3.125 15V7.5M8.125 10.625H11.875M2.5 4.375H17.5C17.85 4.375 18.125 4.65 18.125 5V6.875C18.125 7.22 17.85 7.5 17.5 7.5H2.5C2.15 7.5 1.875 7.22 1.875 6.875V5C1.875 4.65 2.15 4.375 2.5 4.375Z',
);
