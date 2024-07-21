import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Database } from '../config/database';
import { vars } from '../config/variables';
import { AuthHelper, ErrorHelper, RouteHelper } from '../helpers';
import { logger } from '../lib/logger';
import middleware from '../middleware';
import { handleSeed } from '../seeds';
import endpoints from '../services';
import { ResourceRoles } from '../types';

let appServer: any;

(async () => {
  /* Declarations */
  const dev = vars.NODE_ENV !== 'production';

  const app: express.Application = express();

  /* Database Configuration */
  Database.init();

  /* Express Configuration */
  RouteHelper.applyMiddleware(middleware, app);

  /* API Endpoint Configuration */
  RouteHelper.applyRoutes(endpoints, app);

  app.post('/api/v1/seed', AuthHelper.checkAccess(ResourceRoles.Admin), handleSeed);

  /* Error Handler Configuration */
  app.use(ErrorHelper.handleMissingRoute);
  app.use(ErrorHelper.handleGeneric);

  /* Express Server Configuration */
  const httpServer = new http.Server(app);

  appServer = httpServer.listen(vars.PORT, () => {
    logger.log('info', `Napijs server is listening on ${appServer.address().address}${appServer.address().port}`);
  });
})();

// exported for tests
export default appServer;
