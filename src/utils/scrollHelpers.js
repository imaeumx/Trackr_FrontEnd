// src/utils/scrollHelpers.js
import { Platform } from 'react-native';

export const getScrollViewStyles = () => {
  return Platform.select({
    web: {
      container: {
        flex: 1,
        height: '100vh',
        overflow: 'hidden',
      },
      scrollView: {
        flex: 1,
        height: 'calc(100vh - 80px)',
      }
    },
    default: {
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
      }
    }
  });
};

export const ensureScrollableContent = (contentHeight, minHeight = 600) => {
  return {
    minHeight: Math.max(contentHeight, minHeight),
  };
};