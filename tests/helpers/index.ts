import { DateTime } from 'luxon';
import { getObjectId as getObjectIdFromMongo } from 'mongo-seeding';
import { responseMessages } from '../../src/constants/response-messages';

export { getObjectIds } from 'mongo-seeding';

export const getObjectId = getObjectIdFromMongo;

export const mapToEntities = (titles: string[]) => {
  return titles.map((title: string) => {
    const id = getObjectId(title);

    return {
      id,
      title,
    };
  });
};

export const expectValidationError = (res: any, expect: any) => {
  expect(res).to.have.status(400);
  expect(res.body.status).to.eq('error');
  expect(res.body.message).to.eq(responseMessages.ERROR_INVALID_PARAMS);
};

export const assertPropertiesOfObject = (object: Object, properties: string[], expect: Chai.ExpectStatic) => {
  expect(object).to.have.any.keys(properties);
}

export const TODAY = DateTime.local().plus({ day: 2 });
