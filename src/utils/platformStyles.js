import { Platform } from 'react-native';

export const getPlatformStyles = () => {
  if (Platform.OS === 'web') {
    return {
      container: {
        height: '100vh',
        overflow: 'hidden',
      },
      scrollView: {
        height: 'calc(100vh - 80px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      },
      header: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
      scrollContent: {
        minHeight: '100%',
      }
    };
  }
  return {};
};