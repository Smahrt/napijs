import winston from 'winston';
import path from 'path';
import { Environment, vars } from '../config/variables';
import { Database } from '../config/database';
import _ from 'lodash';

require('winston-mongodb');

const errorFilePath = path.join(__dirname, '..', '..', 'logs', 'error.log');
const appFilePath = path.join(__dirname, '..', '..', 'logs', 'app.log');

export const logger = winston.createLogger({
  level: vars.LOG_LEVEL,
  format: winston.format.json(),
  defaultMeta: { service: 'napijs' },
  transports: [
    new winston.transports.File({ filename: errorFilePath, level: 'error' }),
    new winston.transports.File({ filename: appFilePath })
  ]
});

if (vars.NODE_ENV !== Environment.Test) {
  logger.add(new winston.transports['MongoDB']({
    db: Database.uri,
    options: _.omit(Database.options, ['useFindAndModify', 'useCreateIndex', 'autoIndex']),
  }));
}

if (vars.NODE_ENV !== Environment.Production) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
