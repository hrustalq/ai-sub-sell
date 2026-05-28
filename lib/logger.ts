import "server-only";

import { createLogger, getRootLogger, logError } from "./logger/core";

export { createLogger, getRootLogger, logError };

export const logger = getRootLogger();

export default logger;
