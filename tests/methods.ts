import { responseMessages } from '../src/constants/response-messages';

export const expectValidationError = (res: any, expect: any) => {
  expect(res).to.have.status(400);
  expect(res.body.status).to.eq('error');
  expect(res.body.message).to.eq(responseMessages.ERROR_INVALID_PARAMS);
};
