// src/utils/episodeProgressLogger.js
// Simple logger for episode progress debug info
// Usage: episodeProgressLogger.log('message', data)

const logs = [];

const episodeProgressLogger = {
  log: (message, data) => {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    logs.push(entry);
    // For development: print to console
    if (typeof window !== 'undefined') {
      console.log('[EpisodeProgressLogger]', entry);
    }
  },
  getLogs: () => logs,
};

export default episodeProgressLogger;
