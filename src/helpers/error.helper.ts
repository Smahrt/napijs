import { responseMessages } from '../constants/response-messages';
import { responseCodes } from '../constants/response-codes';
import { logger } from '../lib/logger';
import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '.';

export class CustomError extends Error {
  constructor(
    public code = responseCodes.DEFAULT_ERROR_CODE,
    public message = responseMessages.GENERIC, public status = responseCodes.DEFAULT_ERROR_STATUS_CODE,
    public data?: any,
    ...params: any) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.code = code;
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

class errorHelper {

  handleGeneric(err: Error, req: Request, res: Response, _next: NextFunction) {
    const respond = () => {
      if (err instanceof CustomError) {
        return ResponseHelper.sendError(res, err.code, err.message, err.status, err.data);
      } else {
        console.error('error', 'uncaught exception', err); // For debugging reasons
        return ResponseHelper.sendError(res, undefined, undefined, undefined, err);
      }
    };

    if (req.complete) return respond();

    req.once('data', () => {
      // ignore request body
    });

    // Wait for the transfer of the request body to finish before sending a response.
    // Otherwise the client could experience an EPIPE error:
    // https://github.com/nodejs/node/issues/12339
    return req.once('end', respond);
  }

  handleMissingRoute(req: Request, res: Response, next: NextFunction) {
    if (!req.route) {
      next(new CustomError(responseCodes.ERROR_NOT_FOUND, responseMessages.ERROR_NOT_FOUND, 404));
      logger.log('error', `route: ${req.method} ${req.path} does not exist`);
    } else {
      next();
    }
  }
}

export const ErrorHelper = new errorHelper();
