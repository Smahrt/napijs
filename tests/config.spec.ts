import { AuthHelper, EmailHelper } from '../src/helpers';
import mongoose from 'mongoose';
import { getObjectId } from './helpers';
import { runSeeder } from './seeds';
import { registerMocks } from './mocks';
import sinon from 'sinon';

let TEST_TOKEN: string,
  TEST_TOKEN_ADMIN: string,
  emailStub: any;

Promise.all([
  AuthHelper.generateAccessToken({ _id: getObjectId('test-user'), role: 'Member' }),
  AuthHelper.generateAccessToken({ _id: getObjectId('admin'), role: 'Admin' }),
  runSeeder(),
  registerMocks(),
]).then(res => {
  TEST_TOKEN = res[0];
  TEST_TOKEN_ADMIN = res[1];

  console.log('info', `SPEC: opened socket connection and generated auth tokens -- ${JSON.stringify(TEST_TOKEN)}`);
  run();
}).catch(async e => {
  console.log('info', `SPEC: an error occurred while generating auth tokens -- ${JSON.stringify(e)}`);
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
  process.exit(1);
});

beforeEach(async () => {
  // stub sendEmail method using sinon
  emailStub = sinon.stub(EmailHelper, 'sendEmail').resolves({ id: '12345' });
});

afterEach(async () => {
  // restore sendEmail method
  if (emailStub) {
    emailStub.restore();
  }
});

after(async () => {
  if (mongoose.connection && mongoose.connection.db) {
    console.log('info', 'SPEC: dropping database');
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }

  console.log('info', 'SPEC: tests completed. Shutting down.');
});

export {
  TEST_TOKEN,
  TEST_TOKEN_ADMIN,
};
