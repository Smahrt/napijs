import { Response, Request, Router, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { responseCodes } from '../constants/response-codes';
import { responseMessages } from '../constants/response-messages';
import { ResponseHelper } from '.';

type Wrapper = ((router: Router) => void);

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export interface Route {
  path: string;
  method: HttpMethod;
  handler: Handler | Handler[];
}

export enum HttpMethod {
  POST = 'post',
  GET = 'get',
  DELETE = 'delete',
  PUT = 'put'
}

class routeHelper {

  applyMiddleware(middlewareWrappers: Wrapper[], router: Router) {
    for (const wrapper of middlewareWrappers) {
      wrapper(router);
    }
  }

  applyRoutes(routes: Route[], router: Router) {
    for (const route of routes) {
      const { method, path, handler } = route;
      (router as any)[method](path, handler);
    }
  }

  rateLimitHandler(req: Request, res: Response, windowMs: number) {
    res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
    logger.log('warn', 'Rate limit exceeded for ip: ' + req.ip);
    return ResponseHelper.sendError(res, responseCodes.ERROR_LIMIT_EXCEEDED, responseMessages.rateLimitExceeded(), 429);
  }
}

export const RouteHelper = new routeHelper();
