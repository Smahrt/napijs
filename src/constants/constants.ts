import { vars } from "../config/variables";

export const app = {
  BODY_PARSER_LIMIT: '50mb',

  EMPTY_STRING: '',
  ZERO: 0,

  SALT_WORK_FACTOR: 10,

  ITEMS_PER_PAGE: 10,

  ERROR: 'error',
  SUCCESS: 'success',

  EMAIL_REGEX: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  TIME_REGEX: /^([01]\d|2[0-3]):([0-5]\d)$/,
  UTC_OFFSET_REGEX: /[+-]([01]\d|2[0-4])(:?[0-5]\d)?/,
  MONGOID_REGEX: /^[a-fA-F0-9]{24}$/,

  BASE_URL: vars.FRONTEND_URL,

  CONFIRM_ACCOUNT_TEMPLATE: 'confirmAccount',
  FORGOT_PASSWORD_TEMPLATE: 'forgotPassword',

  CONFIRM_ACCOUNT_SUBJECT: 'Confirm your account | Napijs',
  FORGOT_PASSWORD_SUBJECT: 'Reset your password | Napijs'
};

export enum VerificationType {
  Email = 'email',
}
