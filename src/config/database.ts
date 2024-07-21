import mongoose, { Mongoose, ConnectOptions } from 'mongoose';
import { logger } from '../lib/logger';
import { Environment, vars } from './variables';

class DatabaseConfig {
  private RETRY_DELAY = 5000;
  private connectionStrings = {
    test: vars.DATABASE_URI_TEST,
    production: vars.DATABASE_URI,
    staging: vars.DATABASE_URI,
    development: vars.DATABASE_URI_DEV
  };

  public options: ConnectOptions & { useUnifiedTopology: boolean; } = {
    autoIndex: true,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    useUnifiedTopology: true,
  };

  constructor(public db: Mongoose) { }

  protected getConnectionString(env: Environment) {
    return this.connectionStrings[env];
  }

  private get env(): Environment {
    return vars.NODE_ENV || Environment.Development;
  }

  public get uri(): string {
    return this.getConnectionString(this.env);
  }

  private connectMongoose() {
    try {
      return this.db.connect(this.uri, this.options);
    } catch (err) {
      logger.log('error', 'Database: error:', err.message);
    }
  }

  public async init() {
    this.connectMongoose();

    // connection events
    this.db.connection.on('connected', (() => {
      console.log('info: Database: connected %s db at %s', this.env, this.uri);
    }).bind(this));

    this.db.connection.on('error', (async (err: any) => {
      logger.log('error', `Database: connection error: ${err}`);

      setTimeout(this.connectMongoose, this.RETRY_DELAY);
    }).bind(this));

    this.db.connection.on('disconnected', function () {
      logger.log('info', 'Database: disconnected.');
    });

    // for nodemon restarts
    process.once('SIGUSR2', (() => {
      this.gracefulShutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGUSR2');
      });
    }).bind(this));

    // for app termination
    process.on('SIGINT', (() => {
      this.gracefulShutdown('app termination', function () {
        process.exit(0);
      });
    }).bind(this));
  }

  // capture app termination / restart events
  // To be called when process is restarted or terminated
  private gracefulShutdown(msg: string, cb: any) {
    this.db.connection.close().then(() => {
      console.log('info', `Database: disconnected through ${msg}`);
      cb();
    });
  }

  public close() {
    this.gracefulShutdown('external DB close command', function () {
      process.exit();
    });
  }
}

export const Database = new DatabaseConfig(mongoose);
