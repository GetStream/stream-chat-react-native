import { useContext } from 'react';

import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

/** The bottom safe area, or 0 without a `SafeAreaProvider` (where `useSafeAreaInsets` throws). */
export const useBottomSafeArea = () => useContext(SafeAreaInsetsContext)?.bottom ?? 0;
