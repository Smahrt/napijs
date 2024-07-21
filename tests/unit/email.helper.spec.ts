
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { EmailHelper } from '../../src/helpers';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('Email Helper', () => {
  it('should send email without template', () => {
    return expect(EmailHelper.sendEmail('d@g.com', 'Test Subject', { name: 'Test Name' }, null, 'Test content')).to.eventually.be.fulfilled;
  });
});
