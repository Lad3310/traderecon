const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

export const logger = {
  debug: (...args) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info(...args);
    }
  },
  // ... other methods
}; 