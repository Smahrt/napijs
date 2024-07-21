import {
  handleCors,
  handleHelmet,
  handleRateLimiter,
  handleRequestParsing,
  handleServeStaticFiles,
} from './common';

/**
 * Middleware array.
 * ORDER MATTERS!
 */
const middleware = [
  handleCors,
  handleHelmet,
  handleRateLimiter,
  handleRequestParsing,
  handleServeStaticFiles,
];

export default middleware;
