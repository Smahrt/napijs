require('dotenv').config(); // require env constables to make file independent

export enum Environment {
  Staging = 'staging',
  Test = 'test',
  Development = 'development',
  Production = 'production'
}

export enum LogLevel {
  Info = 'info',
  Error = 'error',
  Warn = 'warn'
}

export const vars = {
  // Node/Express Server Config
  PORT: Number(process.env.PORT) || 3000,
  LOG_LEVEL: <LogLevel>process.env.LOG_LEVEL || LogLevel.Info,
  NODE_ENV: <Environment>process.env.NODE_ENV || Environment.Development,

  // Redis Config
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_HOSTNAME: process.env.REDIS_HOSTNAME || 'localhost',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // JSON Web Token Config
  JWT_SECRET: process.env.JWT_SECRET || 'some4zK-8Ksecret8G+Lhrsauce',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',

  // Database Config
  DATABASE_URI: process.env.DATABASE_URI || 'mongodb://localhost:27017/napijs_dev',
  DATABASE_URI_DEV: process.env.DATABASE_URI_DEV || 'mongodb://localhost:27017/napijs_dev',
  DATABASE_URI_TEST: process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/napijs_test',

  // Google Config
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/google/callback',

  // Twitter Config
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL || 'http://127.0.0.1:3000/auth/twitter/callback',

  // Facebook Config
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback',

  // AWS S3 Config
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'archive-master-121436901057',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',

  // Postmark Config
  POSTMARK_API_KEY: process.env.POSTMARK_API_KEY || 'POSTMARK_API_TEST',

  // Frontend Config
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5000',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'demo-password',
};
