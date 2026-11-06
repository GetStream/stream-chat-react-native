import React, { useContext } from 'react';

/**
 * The ID of the `MessageOverlayHostLayer` rendered by the nearest `OverlayProvider`. Views that
 * teleport into that layer use it to tell whether their provider currently owns the overlay.
 */
export const OverlayHostLayerContext = React.createContext<string | undefined>(undefined);

export const useOverlayHostLayerId = () => useContext(OverlayHostLayerContext);
