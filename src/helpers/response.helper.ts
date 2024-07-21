import { PaginateResponse } from './pagination.helper';
import { app } from '../constants/constants';
import { responseCodes } from '../constants/response-codes';
import { responseMessages } from '../constants/response-messages';
import { Response } from 'express';

class ServerResponse {
  constructor(
    public status: string,
    public code: string,
    public message: string,
    public data = null,
    public meta: PaginateResponse | null = null
  ) { }
}

class responseHelper {
  /**
   * Sends a response with a success status
   * @param res
   * @param message
   * @param data
   */
  sendSuccess(res: Response, data?: any, message = app.EMPTY_STRING): void {
    res.status(responseCodes.DEFAULT_SUCCESS_CODE)
      .send(
        new ServerResponse(
          app.SUCCESS,
          app.EMPTY_STRING,
          message,
          data?.[0]?.meta ? data[0].data : data,
          data?.[0]?.meta ? data[0].meta : null
        )
      );

    return;
  }

  /**
   * Sends a json response with an error status
   * @param res Response object
   * @param code Server custom error code
   * @param message Error message
   * @param statusCode HTTP status code
   * @param data Arbitary data
   */
  sendError(res: Response,
    code = responseCodes.DEFAULT_ERROR_CODE,
    message = responseMessages.GENERIC,
    statusCode = responseCodes.DEFAULT_ERROR_STATUS_CODE,
    data?: any) {
    res.status(statusCode)
      .send(new ServerResponse(app.ERROR, code, message, data));

    return;
  }
}

export const ResponseHelper = new responseHelper();
