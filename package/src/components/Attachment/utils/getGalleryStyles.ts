import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';

type Params = {
  colIndex: number;
  numOfColumns: number;
  numOfRows: number;
  rowIndex: number;
  hasThreadReplies?: boolean;
  invertedDirections?: boolean;
  messageText?: string;
  threadList?: boolean;
} & Pick<MessageContextValue, 'groupStyles' | 'alignment'>;

export function getGalleryImageStyles({
  alignment,
  colIndex,
  groupStyles,
  hasThreadReplies,
  invertedDirections,
  messageText,
  numOfColumns,
  numOfRows,
  rowIndex,
  threadList,
}: Params) {
  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;

  const topLeftEdgeExposed = colIndex === 0 && rowIndex === 0;
  const bottomLeftEdgeExposed =
    (!invertedDirections && colIndex === 0 && rowIndex === numOfRows - 1) ||
    (invertedDirections && colIndex === numOfColumns - 1 && rowIndex === 0);
  const topRightEdgeExposed =
    (!invertedDirections && colIndex === numOfColumns - 1 && rowIndex === 0) ||
    (invertedDirections && colIndex === 0 && rowIndex === numOfRows - 1);
  const bottomRightEdgeExposed = colIndex === numOfColumns && rowIndex === numOfRows - 1;

  return {
    borderBottomLeftRadius:
      bottomLeftEdgeExposed &&
      !messageText &&
      ((groupStyle !== 'left_bottom' && groupStyle !== 'left_single') ||
        (hasThreadReplies && !threadList))
        ? 14
        : 0,
    borderBottomRightRadius:
      bottomRightEdgeExposed &&
      !messageText &&
      ((groupStyle !== 'right_bottom' && groupStyle !== 'right_single') ||
        (hasThreadReplies && !threadList))
        ? 14
        : 0,
    borderTopLeftRadius: topLeftEdgeExposed ? 14 : 0,
    borderTopRightRadius: topRightEdgeExposed ? 14 : 0,
  };
}
