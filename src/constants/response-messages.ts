export const responseMessages = {
  /* Error Messages */
  GENERIC: 'Something went wrong. Please try again or contact support',
  ERROR_NOT_FOUND: 'The resource you tried to access does not exist',
  ERROR_FORBIDDEN: 'You don\'t have sufficient permission to access that resource',
  ERROR_NOT_ALLOWED: 'The action you are trying to perform is not allowed',
  ERROR_INVALID_TOKEN: 'You provided an invalid token',
  ERROR_EXPIRED_TOKEN: 'Your session has expired. Please log in again',
  ERROR_MISSING_TOKEN: 'You need to be logged in to continue. Please log in again',
  ERROR_INVALID_PARAMS: 'You are missing something important in your request. Please double-check and try again',
  ERROR_USER_NOT_CREATED: 'The user was not created for some reason. Please try again',
  ERROR_FAILED_AUTH: 'There was a problem trying to authenticate you',
  ERROR_FAILED_VERIFY: 'There was a problem verifying your transaction',
  ERROR_USER_BLOCKED: 'Your account has been blocked. Please contact support',
  ERROR_ALREADY_VERIFIED: 'Looks like your account has already been confirmed',
  ERROR_DUPLICATE_VERIFY: 'A verification email has already been sent to your email address',
  ERROR_FAILED_UPDATE: 'An error occurred while updating. Please try again',

  ERROR_INVALID_EXPERIENCE_DATE: 'The end date cannot be before the start date',
  ERROR_USER_REPORTED_CONNECTION: "Sorry, you can't connect with this user at the moment",

  actionNotAllowed: (action: string) => `Sorry, you are not allowed to ${action}.`,
  resourceNotCreated: (resource: string) => `Sorry, we could not create this ${resource}. Please try again`,
  resourceNotFound: (resource: string) => `Sorry, We could not find ${resource}.`,
  resourceAlreadyExists: (resource: string, name?: string) => `The ${resource} already exists. ${name ? `: ${name}` : ''}`,
  errorSaving: (param: string) => `Sorry, we could not save this ${param}`,
  rateLimitExceeded: (limitType?: string) => `You have made too many ${limitType || ''} requests. Please wait a while and try again.`,

  /* Success Messages */
  SUCCESS_DELETED: 'Resource has been deleted successfully!'
};
