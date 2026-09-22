import { createContext, useContext } from 'react';

/**
 * Tile side length for the picker grid, measured by the grid from its own width rather than the
 * window. Internal to the attachment picker; deliberately not exported from the package.
 */
export const AttachmentPickerTileSizeContext = createContext<number | undefined>(undefined);

export const useAttachmentPickerTileSize = () => useContext(AttachmentPickerTileSizeContext);
