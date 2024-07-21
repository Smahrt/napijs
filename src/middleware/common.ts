import { urlencoded, text, json } from 'body-parser';
import express, { Router } from 'express';
import { app } from '../constants/constants';
import helmet from 'helmet';
import RateLimit from 'express-rate-limit';
import { RouteHelper } from '../helpers';
import { shouldParseBody } from '../lib/utils';

export const handleRequestParsing = (router: Router) => {
  const parseURLEncoded = urlencoded({ limit: app.BODY_PARSER_LIMIT, extended: true });
  const parseText = text({ limit: app.BODY_PARSER_LIMIT });
  const parseJSON = json({ limit: app.BODY_PARSER_LIMIT });
  router.use((req, res, next) => !shouldParseBody(req as any) ? next() : parseJSON(req, res as any, next));
  router.use((req, res, next) => !shouldParseBody(req as any) ? next() : parseText(req, res as any, next));
  router.use((req, res, next) => !shouldParseBody(req as any) ? next() : parseURLEncoded(req, res as any, next));
};

export const handleCors = (router: Router) => {
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      return res.status(200).json({});
    }
    next();
  });
};

export const handleHelmet = (router: Router) => {
  router.use(helmet());
};

export const handleServeStaticFiles = (router: Router) => {
  router.use(express.static('uploads'));
};

export const handleRateLimiter = (router: Router) => {
  const limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 0, // limit each IP to 100 requests per windowMs
    handler: function (req, res) { return RouteHelper.rateLimitHandler(req, res, 15 * 60 * 1000); }
  });
  router.use(limiter);
};
