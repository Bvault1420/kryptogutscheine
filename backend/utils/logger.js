const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

function formatMessage(level, message, meta) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length ? { meta } : {}),
  };
  return JSON.stringify(entry);
}

export const logger = {
  error(message, meta) {
    if (currentLevel >= levels.error) console.error(formatMessage('error', message, meta));
  },
  warn(message, meta) {
    if (currentLevel >= levels.warn) console.warn(formatMessage('warn', message, meta));
  },
  info(message, meta) {
    if (currentLevel >= levels.info) console.log(formatMessage('info', message, meta));
  },
  debug(message, meta) {
    if (currentLevel >= levels.debug) console.debug(formatMessage('debug', message, meta));
  },
};
