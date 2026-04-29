const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLevel = LOG_LEVELS.debug;

export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLevel = LOG_LEVELS[level];
  }
}

function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  });
}

export const logger = {
  debug: (message, data) => {
    if (currentLevel <= LOG_LEVELS.debug) console.log(formatLog('debug', message, data));
  },
  info: (message, data) => {
    if (currentLevel <= LOG_LEVELS.info) console.log(formatLog('info', message, data));
  },
  warn: (message, data) => {
    if (currentLevel <= LOG_LEVELS.warn) console.warn(formatLog('warn', message, data));
  },
  error: (message, data) => {
    if (currentLevel <= LOG_LEVELS.error) console.error(formatLog('error', message, data));
  },
};